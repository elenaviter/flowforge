describe('FlowForge - Application - DevOps Pipelines', () => {
    let application
    function loadApplication (teamName, applicationName) {
        cy.request('GET', '/api/v1/user/teams')
            .then((response) => {
                const team = response.body.teams.find(
                    (team) => team.name === teamName
                )
                return cy.request('GET', `/api/v1/teams/${team.id}/applications`)
            })
            .then((response) => {
                application = response.body.applications.find(
                    (app) => app.name === applicationName
                )
            })
    }

    beforeEach(() => {
        cy.intercept('GET', '/api/*/applications/*').as('getApplication')

        cy.login('bob', 'bbPassword')
        cy.home()
        loadApplication('BTeam', 'application-2')
    })

    it('can navigate to the /pipelines page with EE license', () => {
        cy.visit(`/application/${application.id}`)
        cy.get('[data-nav="application-pipelines"]').should('exist').click()

        cy.url().should('include', `/application/${application.id}/pipelines`)
    })

    it('can create pipelines containing stages', () => {
        cy.intercept('GET', '/api/v1/applications/*/pipelines').as('getPipelines')
        cy.intercept('POST', '/api/v1/pipelines').as('createPipeline')

        cy.visit(`/application/${application.id}/pipelines`)
        cy.wait('@getPipelines')

        const PIPELINE_NAME = `My New Pipeline - ${Math.random().toString(36).substring(2, 7)}`

        // Add pipeline
        cy.get('[data-action="pipeline-add"]').click()
        cy.get('[data-form="pipeline-form"]').should('be.visible')

        cy.get('[data-form="pipeline-name"] input').type(PIPELINE_NAME)
        cy.get('[data-action="create-pipeline"]').click()

        cy.wait('@createPipeline')

        cy.get('[data-el="pipelines-list"]').should('contain', PIPELINE_NAME)

        // Add stage 1
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 1')

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-action="add-stage"]').click()

        // Add stage 2
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 2')

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:last').click()

        cy.get('[data-action="add-stage"]').click()

        // Tidy Up
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.contains('Stage 1')
            cy.contains('Stage 2')

            cy.get('[data-action="delete-pipeline"]').click()
        })

        cy.get('[data-el="platform-dialog"]')
            .should('be.visible')
            .within(() => {
                /* eslint-disable cypress/require-data-selectors */
                cy.get('.ff-dialog-header').contains('Delete Pipeline')
                cy.get('button.ff-btn.ff-btn--danger').click()
                /* eslint-enable */
            })
    })

    it('can edit the instance assigned to a stage', () => {
        cy.intercept('GET', '/api/v1/applications/*/pipelines').as('getPipelines')
        cy.intercept('POST', '/api/v1/pipelines').as('createPipeline')
        cy.intercept('POST', '/api/v1/pipelines/*/stages').as('createPipelineStage')

        cy.visit(`/application/${application.id}/pipelines`)
        cy.wait('@getPipelines')

        const PIPELINE_NAME = `My New Pipeline - ${Math.random().toString(36).substring(2, 7)}`

        // Add pipeline
        cy.get('[data-action="pipeline-add"]').click()
        cy.get('[data-form="pipeline-name"] input').type(PIPELINE_NAME)
        cy.get('[data-action="create-pipeline"]').click()

        cy.wait('@createPipeline')

        // Add stage 1
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type(`Stage 1 for ${PIPELINE_NAME}`)

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:last').click() // prompt

        cy.get('[data-action="add-stage"]').click()

        cy.wait('@createPipelineStage')

        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.contains('instance-2-1')
            cy.get('[data-action="stage-edit"]').click()
        })

        // Stage Edit Form
        cy.get('[data-form="stage-name"] input').should(($input) => {
            const stageName = $input.val()
            expect(stageName).to.equal(`Stage 1 for ${PIPELINE_NAME}`)
        })

        cy.get('[data-form="stage-instance"] .ff-dropdown-selected').should('contain', 'instance-2-1')

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:last').click()

        cy.get('[data-form="stage-instance"] .ff-dropdown-selected').should('contain', 'instance-2-with-devices')

        cy.get('[data-form="stage-action"] .ff-dropdown-selected').should('contain', 'Prompt to select instance snapshot')

        cy.get('[data-action="add-stage"]').click()

        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.contains('instance-2-with-devices')
        })
    })

    it('can push from one stage to another, creating a new snapshot', () => {
        cy.intercept('GET', '/api/v1/applications/*/pipelines').as('getPipelines')
        cy.intercept('POST', '/api/v1/pipelines').as('createPipeline')

        /// Create stages ready to push between
        cy.visit(`/application/${application.id}/pipelines`)
        cy.wait('@getPipelines')

        const PIPELINE_NAME = `My New Pipeline - ${Math.random().toString(36).substring(2, 7)}`

        // Add pipeline
        cy.get('[data-action="pipeline-add"]').click()
        cy.get('[data-form="pipeline-form"]').should('be.visible')

        cy.get('[data-form="pipeline-name"] input').type(PIPELINE_NAME)
        cy.get('[data-action="create-pipeline"]').click()

        cy.wait('@createPipeline')

        // Add stage 1
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 1')

        // Select Instance for Stage 1
        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        // Select "Create new Snapshot"
        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:first').click() // prompt

        cy.get('[data-action="add-stage"]').click()

        // Add stage 2
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 2')

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-action="add-stage"]').click()

        /// Push from stage 1 to stage 2
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-el="ff-pipeline-stage"]:contains("Stage 1")').within(() => {
                cy.get('[data-action="stage-run"]').click()
            })
        })

        cy.get('[data-el="deploy-stage-dialog"].ff-dialog-container--open').should('be.visible')
        cy.get('[data-el="deploy-stage-dialog"].ff-dialog-container--open').within(() => {
            // confirm push

            /* eslint-disable cypress/require-data-selectors */
            cy.get('button.ff-btn.ff-btn--primary').click()
            /* eslint-enable */
        })

        // Tidy Up
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.contains('Stage 1')
            cy.contains('Stage 2')

            cy.get('[data-action="delete-pipeline"]').click()
        })

        cy.get('[data-el="platform-dialog"]')
            .should('be.visible')
            .within(() => {
                /* eslint-disable cypress/require-data-selectors */
                cy.get('.ff-dialog-header').contains('Delete Pipeline')
                cy.get('button.ff-btn.ff-btn--danger').click()
                /* eslint-enable */
            })
    })

    it('can push from one stage to another, prompting for snapshot', () => {
        cy.intercept('GET', '/api/v1/applications/*/pipelines').as('getPipelines')
        cy.intercept('POST', '/api/v1/pipelines').as('createPipeline')

        /// Create stages ready to push between
        cy.visit(`/application/${application.id}/pipelines`)
        cy.wait('@getPipelines')

        const PIPELINE_NAME = `My New Pipeline - ${Math.random().toString(36).substring(2, 7)}`

        // Add pipeline
        cy.get('[data-action="pipeline-add"]').click()
        cy.get('[data-form="pipeline-form"]').should('be.visible')

        cy.get('[data-form="pipeline-name"] input').type(PIPELINE_NAME)
        cy.get('[data-action="create-pipeline"]').click()

        cy.wait('@createPipeline')

        // Add stage 1
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 1')

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:last').click() // prompt

        cy.get('[data-action="add-stage"]').click()

        let instance
        cy.request('GET', '/api/v1/user/teams').then((response) => {
            const team = response.body.teams.find((team) => team.name === 'BTeam')

            return cy.request('GET', `/api/v1/teams/${team.id}/projects`)
        }).then((response) => {
            instance = response.body.projects.find((project) => project.name === 'instance-2-1')

            return cy.request('POST', `/api/v1/projects/${instance.id}/snapshots`, {
                name: `Snapshot 1 for ${PIPELINE_NAME} test`,
                description: 'Description',
                setAsTarget: false
            })
        }).then((response) => {
            return cy.request('POST', `/api/v1/projects/${instance.id}/snapshots`, {
                name: `Snapshot 2 for ${PIPELINE_NAME} test`,
                description: 'Description 2',
                setAsTarget: false
            })
        }).then((response) => {
            // Add stage 2
            cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
                cy.get('[data-action="add-stage"]').click()
            })

            cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 2')

            cy.get('[data-form="stage-instance"] .ff-dropdown').click()
            cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
            cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

            cy.get('[data-form="stage-action"] .ff-dropdown').click()
            cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
            cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:first').click()

            cy.get('[data-action="add-stage"]').click()

            /// Push from stage 1 to stage 2
            cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
                cy.get('[data-el="ff-pipeline-stage"]:contains("Stage 1")').within(() => {
                    cy.get('[data-action="stage-run"]').click()
                })
            })

            cy.get('[data-el="deploy-stage-dialog"].ff-dialog-container--open').should('be.visible')
            cy.get('[data-el="deploy-stage-dialog"].ff-dialog-container--open').within(() => {
                cy.get('[data-form="snapshot-select"]').click()
                cy.get(`[data-form="snapshot-select"] .ff-dropdown-options:contains("Snapshot 2 for ${PIPELINE_NAME} test")`).click()

                /* eslint-disable cypress/require-data-selectors */
                cy.get('button.ff-btn.ff-btn--primary').click()
                /* eslint-enable */
            })

            // Tidy Up
            cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
                cy.contains('Stage 1')
                cy.contains('Stage 2')

                cy.get('[data-action="delete-pipeline"]').click()
            })

            cy.get('[data-el="platform-dialog"]')
                .should('be.visible')
                .within(() => {
                    /* eslint-disable cypress/require-data-selectors */
                    cy.get('.ff-dialog-header').contains('Delete Pipeline')
                    cy.get('button.ff-btn.ff-btn--danger').click()
                    /* eslint-enable */
                })
        })
    })

    it('can push from one stage containing a device to an instance with use_active_snapshot', () => {
        cy.intercept('GET', '/api/v1/applications/*/pipelines').as('getPipelines')
        cy.intercept('POST', '/api/v1/pipelines').as('createPipeline')

        /// Create stages ready to push between
        cy.visit(`/application/${application.id}/pipelines`)
        cy.wait('@getPipelines')

        const PIPELINE_NAME = `My New Pipeline - ${Math.random().toString(36).substring(2, 7)}`

        // Add pipeline
        cy.get('[data-action="pipeline-add"]').click()
        cy.get('[data-form="pipeline-form"]').should('be.visible')

        cy.get('[data-form="pipeline-name"] input').type(PIPELINE_NAME)
        cy.get('[data-action="create-pipeline"]').click()

        cy.wait('@createPipeline')

        // Add stage 1
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-type"]').find('.ff-tile-selection-option:contains("Device")').click()

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 1')

        cy.get('[data-form="stage-device"] .ff-dropdown').click()
        cy.get('[data-form="stage-device"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-device"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:contains("active")').click() // Use active snapshot

        cy.get('[data-action="add-stage"]').click()

        // Add stage 2
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 2')

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-action="add-stage"]').click()

        /// Push from stage 1 to stage 2
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-el="ff-pipeline-stage"]:contains("Stage 1")').within(() => {
                cy.get('[data-action="stage-run"]').click()
            })
        })

        cy.get('[data-el="deploy-stage-dialog"].ff-dialog-container--open').should('be.visible')
        cy.get('[data-el="deploy-stage-dialog"].ff-dialog-container--open').within(() => {
            /* eslint-disable cypress/require-data-selectors */
            cy.get('button.ff-btn.ff-btn--primary').click()
            /* eslint-enable */
        })

        // Tidy Up
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.contains('Stage 1')
            cy.contains('Stage 2')

            cy.get('[data-action="delete-pipeline"]').click()
        })

        cy.get('[data-el="platform-dialog"]')
            .should('be.visible')
            .within(() => {
                /* eslint-disable cypress/require-data-selectors */
                cy.get('.ff-dialog-header').contains('Delete Pipeline')
                cy.get('button.ff-btn.ff-btn--danger').click()
                /* eslint-enable */
            })
    })

    it('cannot push to a device in development mode', () => {
        cy.intercept('GET', '/api/v1/applications/*/pipelines', function (req) {
            req.continue((res) => {
                res.body.pipelines.forEach((pipeline) => {
                    pipeline.stages.forEach((stage) => {
                        stage.devices?.forEach((device) => {
                            device.mode = 'developer'
                            device.isDeploying = false
                        })
                    })
                })
            })
        }).as('getPipelines')
        cy.intercept('POST', '/api/v1/pipelines').as('createPipeline')
        cy.intercept('GET', '/api/v1/applications/*/devices', function (req) {
            req.continue((res) => {
                res.body.devices = res.body.devices.map((device) => {
                    device.mode = 'developer'
                    device.isDeploying = false
                    return device
                })
            })
        }).as('getDevice')

        /// Create stages ready to push between
        cy.visit(`/application/${application.id}/pipelines`)
        cy.wait('@getPipelines')

        const PIPELINE_NAME = `My New Pipeline - ${Math.random().toString(36).substring(2, 7)}`

        // Add pipeline
        cy.get('[data-action="pipeline-add"]').click()
        cy.get('[data-form="pipeline-form"]').should('be.visible')

        cy.get('[data-form="pipeline-name"] input').type(PIPELINE_NAME)
        cy.get('[data-action="create-pipeline"]').click()

        cy.wait('@createPipeline')

        // Add stage 1
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 1')

        cy.get('[data-form="stage-instance"] .ff-dropdown').click()
        cy.get('[data-form="stage-instance"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-instance"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-action="add-stage"]').click()

        // Add stage 2
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-action="add-stage"]').click()
        })

        cy.get('[data-form="stage-type"]').find('.ff-tile-selection-option:contains("Device")').click()

        cy.get('[data-form="stage-name"] input[type="text"]').type('Stage 2')

        cy.get('[data-form="stage-device"] .ff-dropdown').click()
        cy.get('[data-form="stage-device"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-device"] .ff-dropdown-options > .ff-dropdown-option:first').click()

        cy.get('[data-form="stage-action"] .ff-dropdown').click()
        cy.get('[data-form="stage-action"] .ff-dropdown-options').should('be.visible')
        cy.get('[data-form="stage-action"] .ff-dropdown-options > .ff-dropdown-option:contains("active")').click() // Use active snapshot

        cy.get('[data-action="add-stage"]').click()

        /// Push from stage 1 to stage 2
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.get('[data-el="ff-pipeline-stage"]:contains("Stage 1")').within(() => {
                cy.get('[data-action="stage-run"].ff-disabled').should('exist')
            })

            cy.get('[data-el="ff-pipeline-stage"]:contains("Stage 2")').within(() => {
                cy.get('[data-action="stage-run"].ff-disabled').should('exist')
                cy.get('[data-el="stage-banner-error"]').contains('Device in Dev Mode')
            })
        })

        // Not possible to deploy, no dialog should be visible even after the click
        cy.get('[data-el="deploy-stage-dialog"].ff-dialog-container--open').should('not.exist')

        // Tidy Up
        cy.get(`[data-el="pipelines-list"] [data-el="pipeline-row"]:contains("${PIPELINE_NAME}")`).within(() => {
            cy.contains('Stage 1')
            cy.contains('Stage 2')

            cy.get('[data-action="delete-pipeline"]').click()
        })

        cy.get('[data-el="platform-dialog"]')
            .should('be.visible')
            .within(() => {
                /* eslint-disable cypress/require-data-selectors */
                cy.get('.ff-dialog-header').contains('Delete Pipeline')
                cy.get('button.ff-btn.ff-btn--danger').click()
                /* eslint-enable */
            })
    })
})
