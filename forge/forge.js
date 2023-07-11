const cookie = require('@fastify/cookie')
const csrf = require('@fastify/csrf-protection')
const helmet = require('@fastify/helmet')
const fastify = require('fastify')

const auditLog = require('./auditLog')
const comms = require('./comms')
const config = require('./config') // eslint-disable-line n/no-unpublished-require
const containers = require('./containers')
const db = require('./db')
const ee = require('./ee')
const housekeeper = require('./housekeeper')
const license = require('./licensing')
const monitor = require('./monitor')
const postoffice = require('./postoffice')
const routes = require('./routes')
const settings = require('./settings')

// type defs for JSDoc and VSCode Intellisense

/**
 * @typedef {fastify.FastifyInstance} FastifyInstance
 * @typedef {fastify.FastifyRequest} FastifyRequest
 * @typedef {fastify.FastifyReply} FastifyReply
 */

/**
 * The Forge/fastify app instance.
 * @typedef {FastifyInstance} ForgeApplication
 * @alias app - The Fastify app instance
 */

/** @type {ForgeApplication} */
module.exports = async (options = {}) => {
    // TODO: Defer logger configuration until after `config` module is registered
    //       so that we can pull it from user-provided config
    let loggerLevel = 'info'
    if (options.config && options.config.logging) {
        loggerLevel = options.config.logging.level || 'info'
    }
    const server = fastify({
        forceCloseConnections: true,
        bodyLimit: 5242880,
        maxParamLength: 500,
        trustProxy: true,
        logger: {
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss.l'Z'",
                    ignore: 'pid,hostname',
                    singleLine: true
                }
            },
            level: loggerLevel,
            serializers: {
                res (reply) {
                    return {
                        statusCode: reply.statusCode,
                        request: {
                            url: reply.request.raw.url,
                            method: reply.request.method,
                            remoteAddress: reply.request.socket.remoteAddress,
                            remotePort: reply.request.socket.remotePort
                        }
                    }
                }
            }
        }
    })
    server.addHook('onError', async (request, reply, error) => {
        // Useful for debugging when a route goes wrong
        // console.error(error.stack)
    })

    try {
        // Config : loads environment configuration
        await server.register(config, options)
        if (server.config.logging?.level) {
            server.log.level = server.config.logging.level
        }
        // DB : the database connection/models/views/controllers
        await server.register(db)
        // Settings
        await server.register(settings)
        // License
        await server.register(license)
        // Audit Logging
        await server.register(auditLog)

        // Housekeeper
        await server.register(housekeeper)

        // HTTP Server configuration
        if (!server.settings.get('cookieSecret')) {
            await server.settings.set('cookieSecret', server.db.utils.generateToken(12))
        }
        await server.register(cookie, {
            secret: server.settings.get('cookieSecret')
        })
        await server.register(csrf, { cookieOpts: { _signed: true, _httpOnly: true } })
        await server.register(helmet, {
            global: true,
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: false,
            crossOriginResourcePolicy: false,
            hidePoweredBy: true,
            hsts: false,
            frameguard: {
                action: 'deny'
            }
        })

        // Routes : the HTTP routes
        await server.register(routes, { logLevel: server.config.logging.http })
        // Post Office : handles email
        await server.register(postoffice)
        // Comms : real-time communication broker
        await server.register(comms)
        // Containers:
        await server.register(containers)

        await server.register(ee)

        // Monitor
        await server.register(monitor)

        await server.ready()

        // NOTE: This is only likely to do anything after a db upgrade where the settingsHashes are cleared.
        server.db.models.Device.recalculateSettingsHashes(false) // update device.settingsHash if null

        return server
    } catch (err) {
        console.error(err)
        server.log.error(`Failed to start: ${err.toString()}`)
        throw err
    }
}
