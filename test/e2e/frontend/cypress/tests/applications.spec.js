describe('FlowForge - Applications', () => {
    beforeEach(() => {
        cy.intercept('GET', '/api/*/project-types*').as('getInstanceTypes')

        cy.login('alice', 'aaPassword')
        cy.home()
        cy.visit('/admin/instance-types')
        cy.wait('@getInstanceTypes')
    })

    describe('can be created', () => {
        it('without error', () => {
            const APPLICATION_NAME = `new-application-${Math.random().toString(36).substring(2, 7)}`
            const INSTANCE_NAME = `new-instance-${Math.random().toString(36).substring(2, 7)}`

            cy.request('GET', 'api/v1/teams').then((response) => {
                const team = response.body.teams[0]

                cy.visit(`/team/${team.slug}/applications/create`)

                cy.intercept('POST', '/api/*/applications').as('createApplication')
                cy.intercept('POST', '/api/*/projects').as('createInstance')

                cy.get('[data-action="create-project"]').should('be.disabled')

                cy.get('[data-form="application-name"] input').clear()
                cy.get('[data-form="application-name"] input').type(APPLICATION_NAME)

                // Pre-fills name
                cy.get('[data-form="project-name"] input').should(($input) => {
                    const projectName = $input.val()
                    expect(projectName.length).to.be.above(0)
                })

                cy.get('[data-form="project-name"] input').clear()
                cy.get('[data-form="project-name"] input').type(INSTANCE_NAME)
                cy.get('[data-action="create-project"]').should('be.disabled')

                cy.get('[data-form="project-type"]').contains('type1').click()
                cy.get('[data-action="create-project"]').should('not.be.disabled') // stack is auto selected

                cy.get('[data-form="instance-stack"]').contains('stack1').click() // de-select
                cy.get('[data-action="create-project"]').should('be.disabled')

                cy.get('[data-form="instance-stack"]').contains('stack1').click() // re-select

                cy.get('[data-form="project-template"]').should('exist') // template section visible for create

                cy.get('[data-action="create-project"]').should('not.be.disabled').click()

                cy.wait('@createApplication')
                cy.wait('@createInstance')

                cy.contains(APPLICATION_NAME)
                cy.contains(INSTANCE_NAME)
            })
        })

        it('handles instance creation failing gracefully', () => {
            const APPLICATION_NAME = `new-application-${Math.random().toString(36).substring(2, 7)}`
            const IN_USE_INSTANCE_NAME = 'instance-1-1'
            const INSTANCE_NAME = `new-instance-${Math.random().toString(36).substring(2, 7)}`

            cy.request('GET', 'api/v1/teams').then((response) => {
                const team = response.body.teams[0]

                cy.visit(`/team/${team.slug}/applications/create`)

                cy.intercept('POST', '/api/*/applications').as('createApplication')
                cy.intercept('POST', '/api/*/projects').as('createInstance')

                cy.get('[data-action="create-project"]').should('be.disabled')

                cy.get('[data-form="application-name"] input').clear()
                cy.get('[data-form="application-name"] input').type(APPLICATION_NAME)

                cy.get('[data-form="project-name"] input').clear()
                cy.get('[data-form="project-name"] input').type(IN_USE_INSTANCE_NAME)

                cy.get('[data-form="project-type"]').contains('type1').click()
                cy.get('[data-action="create-project"]').click()

                cy.wait('@createApplication')
                cy.wait('@createInstance')

                cy.get('[data-form="project-name"]').contains('name in use')

                cy.get('[data-form="project-name"] input').clear()
                cy.get('[data-form="project-name"] input').type(INSTANCE_NAME)

                cy.get('[data-action="create-project"]').click()

                cy.wait('@createInstance')

                cy.contains(APPLICATION_NAME)
                cy.contains(INSTANCE_NAME)
            })
        })
    })

    it('can be viewed', () => {
        cy.intercept('GET', '/api/*/applications/*').as('getApplication')

        cy.visit('/')

        cy.get('[data-nav="team-applications"]')

        cy.wait('@getTeamApplications')

        cy.contains('application-1').click()

        cy.wait('@getApplication')

        cy.get('[data-el="banner-project-as-admin"]').should('not.exist')

        cy.get('[data-action="open-editor"]').should('exist')
    })

    it('are not permitted to have a duplicate project name during creation', () => {
        cy.request('GET', 'api/v1/teams', { failOnStatusCode: false }).then((response) => {
            const team = response.body.teams[0]

            cy.visit(`/team/${team.slug}/applications/create`)

            cy.get('[data-form="application-name"] input').clear()
            cy.get('[data-form="application-name"] input').type(`new-application-${Math.random().toString(36).substring(2, 7)}`)

            cy.get('[data-form="project-name"] input').clear()
            cy.get('[data-form="project-name"] input').type('instance-1-1')
            cy.get('[data-form="project-type"]').contains('type1').click()

            cy.get('[data-action="create-project"]').click()

            cy.get('[data-form="project-name"] [data-el="form-row-error"]').contains('name in use')
        })
    })

    it('can be updated', () => {
        const START_APPLICATION_NAME = `new-application-${Math.random().toString(36).substring(2, 7)}`
        const UPDATED_APPLICATION_NAME = `updated-application-${Math.random().toString(36).substring(2, 7)}`

        let team
        cy.request('GET', 'api/v1/teams')
            .then((response) => {
                team = response.body.teams[0]
                return cy.request('POST', '/api/v1/applications', {
                    name: START_APPLICATION_NAME,
                    teamId: team.id
                })
            })
            .then((response) => {
                cy.intercept('GET', '/api/*/applications/*').as('getApplication')

                cy.visit('/')

                cy.get('[data-nav="team-applications"]')

                cy.wait('@getTeamApplications')

                cy.contains(START_APPLICATION_NAME).click()

                cy.wait('@getApplication')

                cy.get('[data-nav="application-settings"]').click()

                cy.get('[data-el="application-settings"]').within(() => {
                    cy.get('[data-action="application-edit"]').click()

                    cy.get('[data-form="application-name"] input[type="text"]').clear()
                    cy.get('[data-form="application-name"] input[type="text"]').type(UPDATED_APPLICATION_NAME)

                    cy.get('[data-form="submit"]').click()
                })

                // Name updated on application page
                cy.get('[data-el="application-name"]').contains(UPDATED_APPLICATION_NAME)

                cy.get('[data-nav="team-applications"]').click()

                // Name updated on team page
                cy.wait('@getTeamApplications')

                cy.contains(UPDATED_APPLICATION_NAME).should('exist')
                cy.contains(START_APPLICATION_NAME).should('not.exist')
            })
    })

    it('can be deleted', () => {
        const APPLICATION_NAME = `new-application-${Math.random().toString(36).substring(2, 7)}`

        cy.intercept('DELETE', '/api/*/applications/*').as('deleteProject')

        let team
        cy.request('GET', 'api/v1/teams')
            .then((response) => {
                team = response.body.teams[0]
                return cy.request('POST', '/api/v1/applications', {
                    name: APPLICATION_NAME,
                    teamId: team.id
                })
            })
            .then((response) => {
                cy.intercept('GET', '/api/*/applications/*').as('getApplication')

                const application = response.body
                cy.visit(`/application/${application.id}/settings`)
                cy.wait('@getApplication')

                cy.get('[data-el="delete-application-dialog"]').should('not.be.visible')
                cy.get('[data-action="delete-application"]').click()

                cy.get('[data-el="delete-application-dialog"]')
                    .should('be.visible')
                    .within(() => {
                        // Dialog is open
                        cy.get('.ff-dialog-header').contains('Delete Application')

                        // Main button should be disabled
                        cy.get('button.ff-btn.ff-btn--danger').should('be.disabled')
                        cy.get('[data-form="application-name"] input[type="text"]').type(APPLICATION_NAME)

                        // Should now be enabled again
                        cy.get('button.ff-btn.ff-btn--danger').click()
                    })

                cy.wait('@deleteProject')

                cy.url().should('include', `/team/${team.slug}/applications`)
            })
    })

    it('check if application has instances, then delete application button should be disabled, and if application has no instances, the button should be enabled', () => {
        // Check if the application has instances
        cy.visit('/team/ateam/applications')

        cy.get('[data-action="view-application"]').first().click()
        cy.url().then(url => {
            const applicationId = url.split('/')
            cy.visit(`/application/${applicationId[4]}/settings`)
            cy.get('[data-action="delete-application"]').should('be.disabled')
        })

        // Check if the application has no instances
        cy.visit('/team/ateam/applications')
        cy.get('[data-action="view-application"]').eq(1).click()
        cy.url().then(url => {
            const applicationId = url.split('/')
            cy.visit(`/application/${applicationId[4]}/settings`)
            cy.get('[data-action="delete-application"]').should('not.be.disabled')
        })
    })
})

describe('FlowForge - Applications - With Billing', () => {
    beforeEach(() => {
        cy.enableBilling()
    })

    it('can create a project that will charge the user', () => {
        cy.intercept('POST', '/api/*/applications').as('createApplication')
        cy.intercept('POST', '/api/*/projects').as('createInstance')

        cy.login('alice', 'aaPassword')
        cy.home()

        cy.request('GET', 'api/v1/teams').then((response) => {
            const team = response.body.teams[0]

            cy.visit(`/team/${team.slug}/applications/create`)

            cy.get('[data-action="create-project"]').should('be.disabled')

            cy.get('[data-el="charges-table"]').should('not.exist')

            cy.get('[data-form="application-name"] input').clear()
            cy.get('[data-form="application-name"] input').type(`new-application-${Math.random().toString(36).substring(2, 7)}`)
            cy.contains('type1').click()

            cy.get('[data-el="charges-table"]').should('exist')

            cy.get('[data-el="selected-instance-type-name"]').contains('type1')
            cy.get('[data-el="selected-instance-type-cost"]').contains('$15.00')
            cy.get('[data-el="selected-instance-type-interval"]').contains('/mo')

            cy.get('[data-el="payable-now-summary"]').contains('$15.00 now').contains('$15.00 /month')

            cy.get('[data-action="create-project"]').should('not.be.disabled').click()
        })
    })

    it('considers any credit balance the team may have when creating a project', () => {
        cy.applyBillingCreditToTeam(1001)
        cy.login('alice', 'aaPassword')
        cy.home()

        cy.request('GET', 'api/v1/teams').then((response) => {
            const team = response.body.teams[0]

            cy.visit(`/team/${team.slug}/applications/create`)

            cy.wait('@getTeamBySlug')
            cy.wait('@getTeamBilling')

            cy.get('[data-el="charges-table"]').should('not.exist')

            cy.get('[data-form="application-name"] input').clear()
            cy.get('[data-form="application-name"] input').type(`new-application-${Math.random().toString(36).substring(2, 7)}`)
            cy.contains('type1').click()

            cy.get('[data-el="charges-table"]').should('exist')

            cy.get('[data-el="credit-balance-banner"]').should('exist').contains('$10.01')

            cy.get('[data-el="selected-instance-type-name"]').contains('type1')
            cy.get('[data-el="selected-instance-type-cost"]').contains('$15.00')
            cy.get('[data-el="selected-instance-type-interval"]').contains('/mo')

            cy.get('[data-el="credit-balance-row"]').should('exist')
            cy.get('[data-el="credit-balance-amount"]').contains('$10.01')

            cy.get('[data-el="payable-now-summary"]').contains('$4.99')

            cy.get('[data-action="create-project"]').should('not.be.disabled').click()
        })
    })
})

describe('FlowForge stores audit logs for an application', () => {
    beforeEach(() => {
        cy.login('alice', 'aaPassword')
        cy.home()
        cy.visit('/team/ateam/audit-log')
    })

    it('when it is created', () => {
        cy.get('.ff-audit-entry').contains('Application Created')
    })

    it('when it is updated', () => {
        cy.get('.ff-audit-entry').contains('Application Modified')
    })

    it('when it is deleted', () => {
        cy.get('.ff-audit-entry').contains('Application Deleted')
    })
})
