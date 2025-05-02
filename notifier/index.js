// notification-service/index.js
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { EmailNotifier } from './email/EmailNotifier.js';
import { WhatsAppNotifier } from './whatsapp/WhatsAppNotifier.js';

// Load environment variables
dotenv.config();

// Initialize notifiers
const emailNotifier = new EmailNotifier();
const whatsappNotifier = new WhatsAppNotifier();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }
});

// Register plugins
fastify.register(fastifyCors);
fastify.register(fastifyHelmet);

// Define schema for validation
const notifySchema = {
  schema: {
    body: {
      type: 'object',
      required: ['message', 'recipients'],
      properties: {
        message: { type: 'string' },
        recipients: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            whatsapp: { type: 'string' }
          },
          additionalProperties: false
        },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['email', 'whatsapp'] }
        }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          notifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                channel: { type: 'string' },
                success: { type: 'boolean' },
                error: { type: 'string' }
              }
            }
          }
        }
      },
      400: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' }
        }
      },
      500: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          notifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                channel: { type: 'string' },
                success: { type: 'boolean' },
                error: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'notification-service' };
});

// Send notification endpoint
fastify.post('/api/notify', notifySchema, async (request, reply) => {
  try {
    const { message, recipients, channels } = request.body;

    // Validate recipients
    if (!recipients.email && !recipients.whatsapp) {
      return reply.code(400).send({
        success: false,
        error: 'At least one recipient (email or whatsapp) is required'
      });
    }

    // Default to all channels if not specified
    const useEmail = !channels || channels.includes('email');
    const useWhatsapp = !channels || channels.includes('whatsapp');

    const notifications = [];

    // Send email notification
    if (useEmail && recipients.email) {
      try {
        await emailNotifier.notify(message, recipients.email);
        notifications.push({ channel: 'email', success: true });
      } catch (error) {
        fastify.log.error({ err: error }, 'Email notification failed');
        notifications.push({ channel: 'email', success: false, error: error.message });
      }
    }

    // Send WhatsApp notification
    if (useWhatsapp && recipients.whatsapp) {
      try {
        await whatsappNotifier.notify(message, recipients.whatsapp);
        notifications.push({ channel: 'whatsapp', success: true });
      } catch (error) {
        fastify.log.error({ err: error }, 'WhatsApp notification failed');
        notifications.push({ channel: 'whatsapp', success: false, error: error.message });
      }
    }

    // Check if at least one notification was successful
    const anySuccess = notifications.some(n => n.success);

    if (anySuccess) {
      return {
        success: true,
        message: 'Notifications sent',
        notifications
      };
    } else {
      return reply.code(500).send({
        success: false,
        error: 'All notifications failed',
        notifications
      });
    }
  } catch (error) {
    fastify.log.error({ err: error }, 'Error processing notification');
    return reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Bulk notification schema
const bulkNotifySchema = {
  schema: {
    body: {
      type: 'object',
      required: ['message', 'recipientsList'],
      properties: {
        message: { type: 'string' },
        recipientsList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              whatsapp: { type: 'string' }
            }
          }
        },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['email', 'whatsapp'] }
        }
      }
    }
  }
};

// Bulk notification endpoint
fastify.post('/api/notify/bulk', bulkNotifySchema, async (request, reply) => {
  try {
    const { message, recipientsList, channels } = request.body;

    if (recipientsList.length === 0) {
      return reply.code(400).send({
        success: false,
        error: 'recipientsList must not be empty'
      });
    }

    // Default to all channels if not specified
    const useEmail = !channels || channels.includes('email');
    const useWhatsapp = !channels || channels.includes('whatsapp');

    const results = [];

    // Process each recipient
    for (const recipients of recipientsList) {
      const notifications = [];

      // Send email notification
      if (useEmail && recipients.email) {
        try {
          await emailNotifier.notify(message, recipients.email);
          notifications.push({ channel: 'email', success: true });
        } catch (error) {
          fastify.log.error({ err: error }, 'Email notification failed');
          notifications.push({ channel: 'email', success: false, error: error.message });
        }
      }

      // Send WhatsApp notification
      if (useWhatsapp && recipients.whatsapp) {
        try {
          await whatsappNotifier.notify(message, recipients.whatsapp);
          notifications.push({ channel: 'whatsapp', success: true });
        } catch (error) {
          fastify.log.error({ err: error }, 'WhatsApp notification failed');
          notifications.push({ channel: 'whatsapp', success: false, error: error.message });
        }
      }

      results.push({
        recipient: recipients,
        notifications
      });
    }

    return {
      success: true,
      message: 'Bulk notifications processed',
      results
    };
  } catch (error) {
    fastify.log.error({ err: error }, 'Error processing bulk notification');
    return reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Template notification schema
const templateNotifySchema = {
  schema: {
    body: {
      type: 'object',
      required: ['templateId', 'templateData', 'recipients'],
      properties: {
        templateId: { type: 'string' },
        templateData: {
          type: 'object',
          additionalProperties: true
        },
        recipients: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            whatsapp: { type: 'string' }
          }
        },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['email', 'whatsapp'] }
        }
      }
    }
  }
};

// Template notification endpoint
fastify.post('/api/notify/template', templateNotifySchema, async (request, reply) => {
  try {
    const { templateId, templateData, recipients, channels } = request.body;

    // Validate recipients
    if (!recipients.email && !recipients.whatsapp) {
      return reply.code(400).send({
        success: false,
        error: 'At least one recipient (email or whatsapp) is required'
      });
    }

    // Get the template
    let template;
    try {
      template = await getTemplate(templateId);
    } catch (error) {
      return reply.code(404).send({
        success: false,
        error: `Template ${templateId} not found`
      });
    }

    // Compile the template with data
    const message = compileTemplate(template, templateData);

    // Default to all channels if not specified
    const useEmail = !channels || channels.includes('email');
    const useWhatsapp = !channels || channels.includes('whatsapp');

    const notifications = [];

    // Send email notification
    if (useEmail && recipients.email) {
      try {
        await emailNotifier.notify(message, recipients.email);
        notifications.push({ channel: 'email', success: true });
      } catch (error) {
        fastify.log.error({ err: error }, 'Email notification failed');
        notifications.push({ channel: 'email', success: false, error: error.message });
      }
    }

    // Send WhatsApp notification
    if (useWhatsapp && recipients.whatsapp) {
      try {
        await whatsappNotifier.notify(message, recipients.whatsapp);
        notifications.push({ channel: 'whatsapp', success: true });
      } catch (error) {
        fastify.log.error({ err: error }, 'WhatsApp notification failed');
        notifications.push({ channel: 'whatsapp', success: false, error: error.message });
      }
    }

    // Check if at least one notification was successful
    const anySuccess = notifications.some(n => n.success);

    if (anySuccess) {
      return {
        success: true,
        message: 'Template notifications sent',
        notifications
      };
    } else {
      return reply.code(500).send({
        success: false,
        error: 'All template notifications failed',
        notifications
      });
    }
  } catch (error) {
    fastify.log.error({ err: error }, 'Error processing template notification');
    return reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to get a template
async function getTemplate(templateId) {
  // In a real implementation, this would fetch from a database or file system
  // For now, we'll use a simple in-memory mapping
  const templates = {
    'job_application': 'Your job application for {{position}} at {{company}} has been {{status}}.',
    'interview_invite': 'You have been invited for an interview at {{company}} for the {{position}} position on {{date}} at {{time}}.',
    'error_notification': 'There was an error with your job automation: {{error_message}}'
  };

  if (!templates[templateId]) {
    throw new Error(`Template ${templateId} not found`);
  }

  return templates[templateId];
}

// Helper function to compile a template with data
function compileTemplate(template, data) {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    return data[key] || match;
  });
}

// Start the server
const start = async () => {
  try {
    await fastify.listen({
      port: process.env.PORT || 10113,
      host: '0.0.0.0' // Listen on all interfaces
    });

    fastify.log.info(`Notification service listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();