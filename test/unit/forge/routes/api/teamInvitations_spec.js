const should = require('should') // eslint-disable-line
const setup = require('../setup')

const FF_UTIL = require('flowforge-test-utils')
const { Roles } = FF_UTIL.require('forge/lib/roles')

describe('Team Invitations API', function () {
    let app
    const TestObjects = {}

    before(async function () {
        app = await setup()

        // alice : admin
        // bob
        // chris

        // ATeam ( alice  (owner), bob )
        // BTeam ( bob (owner) )

        // Alice create in setup()
        TestObjects.alice = await app.db.models.User.byUsername('alice')
        TestObjects.bob = await app.db.models.User.create({ username: 'bob', name: 'Bob Solo', email: 'bob@example.com', email_verified: true, password: 'bbPassword' })
        TestObjects.chris = await app.db.models.User.create({ username: 'chris', name: 'Chris Kenobi', email: 'chris@example.com', email_verified: true, password: 'ccPassword' })

        // ATeam create in setup()
        TestObjects.ATeam = await app.db.models.Team.byName('ATeam')
        TestObjects.BTeam = await app.db.models.Team.create({ name: 'BTeam', TeamTypeId: app.defaultTeamType.id })

        // Alice set as ATeam owner in setup()
        await TestObjects.ATeam.addUser(TestObjects.bob, { through: { role: Roles.Member } })
        await TestObjects.BTeam.addUser(TestObjects.bob, { through: { role: Roles.Owner } })

        TestObjects.tokens = {}
        await login('alice', 'aaPassword')
        await login('bob', 'bbPassword')
        await login('chris', 'ccPassword')
    })
    after(async function () {
        await app.close()
    })
    afterEach(async function () {
        app.config.email.transport.empty()
        await app.db.models.Invitation.destroy({ where: {} })
    })

    async function login (username, password) {
        const response = await app.inject({
            method: 'POST',
            url: '/account/login',
            payload: { username, password, remember: false }
        })
        response.cookies.should.have.length(1)
        response.cookies[0].should.have.property('name', 'sid')
        TestObjects.tokens[username] = response.cookies[0].value
    }

    describe('Create an invitation', async function () {
        // POST /api/v1/teams/:teamId/invitations

        it('team owner can invite user to team', async () => {
            // Alice invite Chris to ATeam
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.alice },
                payload: {
                    user: 'chris',
                    role: Roles.Viewer
                }
            })
            const result = response.json()
            result.should.have.property('status', 'okay')
            app.config.email.transport.getMessageQueue().should.have.lengthOf(1)

            const invites = await app.db.models.Invitation.findAll()
            invites.should.have.lengthOf(1)
            invites[0].should.have.property('role', Roles.Viewer)
        })

        it('team member cannot invite user to team', async () => {
            // Bob cannot invite Chris to ATeam
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.bob },
                payload: {
                    user: 'chris'
                }
            })
            response.statusCode.should.equal(403)
        })

        it('admin can invite user to team they are not in', async () => {
            // Alice can invite Chris to BTeam
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.alice },
                payload: {
                    user: 'chris'
                },
                role: Roles.Member
            })
            const result = response.json()
            result.should.have.property('status', 'okay')
            app.config.email.transport.getMessageQueue().should.have.lengthOf(1)
            const invites = await app.db.models.Invitation.findAll()
            invites.should.have.lengthOf(1)
            invites[0].should.have.property('role', Roles.Member)
        })

        it('team owner can invite multiple users to team', async () => {
            // Bob invite Alice,Chris to ATeam
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.BTeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.bob },
                payload: {
                    user: 'chris , alice'
                }
            })
            const result = response.json()
            result.should.have.property('status', 'okay')
            app.config.email.transport.getMessageQueue().should.have.lengthOf(2)
        })

        it('owner cannot invite existing team user to team', async () => {
            // Alice cannot invite Bob to ATeam
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.alice },
                payload: {
                    user: 'bob'
                }
            })
            const result = response.json()
            result.should.have.property('code', 'invitation_failed')
            result.should.have.property('error')
            result.error.should.have.property('bob', 'Already a member of the team')
            app.config.email.transport.getMessageQueue().should.have.lengthOf(0)
        })

        it('owner can request invites for existing and new users', async () => {
            // Alice invites Bob and Chris to ATeam - mixed result
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.alice },
                payload: {
                    user: 'bob, chris'
                }
            })
            const result = response.json()
            result.should.have.property('code', 'invitation_failed')
            result.should.have.property('error')
            result.error.should.have.property('bob', 'Already a member of the team')
            // But an email is still sent to chris
            app.config.email.transport.getMessageQueue().should.have.lengthOf(1)
        })

        it('no more than 5 invites at a time', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.alice },
                payload: {
                    user: 'alice, bob, chris, dave, eric, fred'
                }
            })
            response.statusCode.should.equal(429)
            const result = response.json()
            result.should.have.property('code', 'too_many_invites')
            result.should.have.property('error')
        })

        it('deduplicate user invites', async () => {
            // invite 4 users, 3 of them are duplicates in various forms
            // ensure only 1 email is sent
            app.config.email.transport.empty()
            app.settings.set('team:user:invite:external', true)
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.alice },
                payload: {
                    user: 'chris, chris, Chris, CHRIS'
                }
            })
            const result = response.json()
            result.should.have.property('status', 'okay')
            app.config.email.transport.getMessageQueue().should.have.lengthOf(1)
        })

        describe('external users', async function () {
            beforeEach(function () {
                app.settings.set('team:user:invite:external', true)
                app.config.email.transport.empty()
            })

            after(function () {
                app.settings.set('team:user:invite:external', false)
            })

            it('team owner cannot invite external user if external invitations are disabled', async () => {
                app.settings.set('team:user:invite:external', false)
                // Alice cannot invite dave@example.com to ATeam
                const response = await app.inject({
                    method: 'POST',
                    url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                    cookies: { sid: TestObjects.tokens.alice },
                    payload: {
                        user: 'dave@example.com'
                    }
                })
                const result = response.json()
                result.should.have.property('code', 'invitation_failed')
                result.should.have.property('error')
                result.error.should.have.property('dave@example.com', 'External invites not permitted')

                app.config.email.transport.getMessageQueue().should.have.lengthOf(0)
            })

            it('team owner can invite external user if disabled', async () => {
                const response = await app.inject({
                    method: 'POST',
                    url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                    cookies: { sid: TestObjects.tokens.alice },
                    payload: {
                        user: 'dave@example.com'
                    }
                })
                const result = response.json()
                result.should.have.property('status', 'okay')
                app.config.email.transport.getMessageQueue().should.have.lengthOf(1)
                app.config.email.transport.getMessageQueue()[0].should.have.property('to', 'dave@example.com')
            })

            it('deduplicate emails and gmail "dot-trick" aliases in list of external invites', async () => {
                // invite 7 users, 5 of them are duplicates (either through capitalisation or gmail dot-trick)
                // ensure only 2 emails are sent
                app.settings.set('team:user:invite:external', true)
                const response = await app.inject({
                    method: 'POST',
                    url: `/api/v1/teams/${TestObjects.ATeam.hashid}/invitations`,
                    cookies: { sid: TestObjects.tokens.alice },
                    payload: {
                        user: 'alice@jediknights.fake, Alice@JediKnights.fake, ALICE@JediKnights.Fake, bobsolo@gmail.co.fake, BobSolo@gmail.co.fake, bob.so.lo@gmail.co.fake, Bob.SoLo@Gmail.co.fake'
                    }
                })
                const result = response.json()
                result.should.have.property('status', 'okay')
                app.config.email.transport.getMessageQueue().should.have.lengthOf(2)
                app.config.email.transport.getMessageQueue()[0].should.have.property('to', 'alice@jediknights.fake')
                app.config.email.transport.getMessageQueue()[1].should.have.property('to', 'bobsolo@gmail.co.fake')
            })
        })
    })

    describe('List team invitations', async function () {
        before(function () {
            app.settings.set('team:user:invite:external', true)
        })
        after(function () {
            app.settings.set('team:user:invite:external', false)
        })

        // GET /api/v1/teams/:teamId/invitations
        it('team owner can get the list of invites', async () => {
            const response = await app.inject({
                method: 'POST',
                url: `/api/v1/teams/${TestObjects.BTeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.bob },
                payload: {
                    user: 'chris , evans@example.com'
                }
            })
            const result = response.json()
            result.should.have.property('status', 'okay')

            const inviteListResponse = await app.inject({
                method: 'GET',
                url: `/api/v1/teams/${TestObjects.BTeam.hashid}/invitations`,
                cookies: { sid: TestObjects.tokens.bob }
            })
            const inviteList = inviteListResponse.json()
            inviteList.should.have.property('count', 2)
            inviteList.should.have.property('invitations')
            inviteList.invitations.should.have.length(2)

            inviteList.invitations[0].team.should.have.property('id', TestObjects.BTeam.hashid)
            inviteList.invitations[1].team.should.have.property('id', TestObjects.BTeam.hashid)
            inviteList.invitations[0].invitor.should.have.property('id', TestObjects.bob.hashid)
            inviteList.invitations[1].invitor.should.have.property('id', TestObjects.bob.hashid)

            inviteList.invitations[0].invitee.should.have.property('id', TestObjects.chris.hashid)
            inviteList.invitations[0].invitee.should.not.have.property('external')

            inviteList.invitations[1].invitee.should.have.property('email', 'evans@example.com')
            inviteList.invitations[1].invitee.should.have.property('external', true)
        })
    })

    describe('Delete an invitation team member', async function () {
        // DELETE /api/v1/teams/:teamId/invitations/:invitationId
    })
})
