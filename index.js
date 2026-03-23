#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { createServer } from 'http';

// Rule API Client
class RuleAPIClient {
  constructor(apiKey, baseURL = 'https://app.rule.io/api') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Helper to handle API responses
  async request(method, endpoint, data = null, params = {}) {
    try {
      const config = { method, url: endpoint, params };
      if (data) config.data = data;
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      throw new Error(
        `Rule API Error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // SUBSCRIBERS
  async createSubscribers(data) {
    return this.request('POST', '/v2/subscribers', data);
  }

  async getSubscribers(params = {}) {
    return this.request('GET', '/v2/subscribers', null, params);
  }

  async getSubscriber(identifier, identifiedBy = 'email') {
    return this.request(
      'GET',
      `/v2/subscribers/${encodeURIComponent(identifier)}`,
      null,
      { identified_by: identifiedBy }
    );
  }

  async getSubscriberFields(identifier, identifiedBy = 'email') {
    return this.request(
      'GET',
      `/v2/subscriber/${encodeURIComponent(identifier)}/fields`,
      null,
      { identified_by: identifiedBy }
    );
  }

  async updateSubscriber(identifier, data) {
    return this.request('PUT', `/v2/subscribers/${identifier}`, data);
  }

  async deleteSubscriber(identifier, identifiedBy = 'email') {
    return this.request(
      'DELETE',
      `/v2/subscribers/${encodeURIComponent(identifier)}`,
      null,
      { identified_by: identifiedBy }
    );
  }

  // SUBSCRIBER TAGS
  async addSubscriberTags(identifier, tags, identifiedBy = 'email') {
    return this.request(
      'POST',
      `/v2/subscribers/${encodeURIComponent(identifier)}/tags`,
      { tags },
      { identified_by: identifiedBy }
    );
  }

  async getSubscriberTags(identifier, identifiedBy = 'email') {
    return this.request(
      'GET',
      `/v2/subscribers/${encodeURIComponent(identifier)}/tags`,
      null,
      { identified_by: identifiedBy }
    );
  }

  async clearSubscriberTags(identifier, identifiedBy = 'email') {
    return this.request(
      'DELETE',
      `/v2/subscribers/${encodeURIComponent(identifier)}/tags/clear`,
      null,
      { identified_by: identifiedBy }
    );
  }

  async deleteSubscriberTag(identifier, tagIdentifier, identifiedBy = 'email') {
    return this.request(
      'DELETE',
      `/v2/subscribers/${encodeURIComponent(identifier)}/tags/${encodeURIComponent(tagIdentifier)}`,
      null,
      { identified_by: identifiedBy }
    );
  }

  // TAGS
  async getTags(params = {}) {
    return this.request('GET', '/v2/tags', null, params);
  }

  async getTag(identifier, identifiedBy = 'name', withCount = false) {
    return this.request(
      'GET',
      `/v2/tags/${encodeURIComponent(identifier)}`,
      null,
      { identified_by: identifiedBy, with_count: withCount }
    );
  }

  async updateTag(identifier, data) {
    return this.request('PUT', `/v2/tags/${encodeURIComponent(identifier)}`, data);
  }

  async deleteTag(identifier) {
    return this.request('DELETE', `/v2/tags/${encodeURIComponent(identifier)}`);
  }

  async clearTag(identifier) {
    return this.request('DELETE', `/v2/tags/${encodeURIComponent(identifier)}/clear`);
  }

  // SEGMENTS
  async getSegments(params = {}) {
    return this.request('GET', '/v2/segments', null, params);
  }

  // TRANSACTIONS
  async sendTransaction(data) {
    return this.request('POST', '/v2/transactionals', data);
  }

  // TEMPLATES
  async getTemplates() {
    return this.request('GET', '/v2/templates');
  }

  async getTemplate(id) {
    return this.request('GET', `/v2/templates/${id}`);
  }

  // CAMPAIGNS
  async getCampaigns(params = {}) {
    return this.request('GET', '/v2/campaigns', null, params);
  }

  async createCampaign(data) {
    return this.request('POST', '/v2/campaigns', data);
  }

  async getCampaign(id) {
    return this.request('GET', `/v2/campaigns/${id}`);
  }

  async getCampaignStatistics(id) {
    return this.request('GET', `/v2/campaigns/${id}/statistics`);
  }

  async sendCampaign(data) {
    return this.request('POST', '/v2/campaigns/send', data);
  }

  async scheduleCampaign(data) {
    return this.request('POST', '/v2/campaigns/schedule', data);
  }

  async deleteCampaign(id) {
    return this.request('DELETE', `/v2/campaign/${id}`);
  }

  // SUBSCRIBER FIELDS
  async createGroupsAndFields(data) {
    return this.request('POST', '/v2/customizations', data);
  }

  async getGroups(params = {}) {
    return this.request('GET', '/v2/customizations', null, params);
  }

  async getGroup(identifier) {
    return this.request('GET', `/v2/customizations/${encodeURIComponent(identifier)}`);
  }

  // SUPPRESSIONS
  async getSuppressions(params = {}) {
    return this.request('GET', '/v2/suppressions', null, params);
  }

  // PREFERENCES
  async getPreferenceGroups() {
    return this.request('GET', '/v2/preference-groups');
  }

  async getSubscriberPreferences(identifier, preferenceGroupId, identifiedBy = 'email') {
    return this.request(
      'GET',
      `/v2/subscriber/${encodeURIComponent(identifier)}/preference_group/${preferenceGroupId}`,
      null,
      { identified_by: identifiedBy }
    );
  }

  async updateSubscriberPreferences(identifier, preferenceGroupId, data, identifiedBy = 'email') {
    return this.request(
      'PATCH',
      `/v2/subscriber/${encodeURIComponent(identifier)}/preference_group/${preferenceGroupId}`,
      data,
      { identified_by: identifiedBy }
    );
  }

  // JOURNEYS
  async getJourneys(params = {}) {
    return this.request('GET', '/v2/journey', null, params);
  }
}

// MCP Server Setup
function createMCPServer(ruleClient) {
  const server = new Server(
    { name: 'rule-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );
  setupHandlers(server, ruleClient);
  return server;
}

function setupHandlers(server, ruleClient) {

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // SUBSCRIBER TOOLS
      {
        name: 'rule_create_subscribers',
        description: 'Create one or multiple subscribers in Rule. Can update existing subscribers if update_on_duplicate is true. Supports custom fields, tags, automation triggers, and opt-in flows.',
        inputSchema: {
          type: 'object',
          properties: {
            subscribers: {
              oneOf: [
                { type: 'object' },
                { type: 'array', items: { type: 'object' } }
              ],
              description: 'Single subscriber object or array of subscriber objects. Each must have email or phone_number.'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags to apply (names or IDs). Creates new tags if they don\'t exist.'
            },
            update_on_duplicate: {
              type: 'boolean',
              description: 'Update subscriber if already exists (default: false)'
            },
            automation: {
              type: 'string',
              enum: ['reset', 'force', false],
              description: 'Automation behavior: reset (reset flows), force (trigger flows), false (default)'
            },
            sync_subscribers: {
              type: 'boolean',
              description: 'Whether to trigger automations (default: auto for <20 subscribers)'
            },
            fields_clear: {
              type: 'boolean',
              description: 'Clear all custom fields before creating (default: false)'
            }
          },
          required: ['subscribers']
        }
      },
      {
        name: 'rule_get_subscribers',
        description: 'Get all subscribers with pagination support (max 100 per page).',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of subscribers to fetch (max 100, default 100)',
              maximum: 100
            },
            page: {
              type: 'number',
              description: 'Page number for pagination'
            }
          }
        }
      },
      {
        name: 'rule_get_subscriber',
        description: 'Get detailed information about a specific subscriber by email, phone number, or ID.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'rule_get_subscriber_fields',
        description: 'Get all custom field values for a specific subscriber organized by groups.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'rule_update_subscriber',
        description: 'Update subscriber information including email, phone, language, tags, and custom fields.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'number',
              description: 'Subscriber ID'
            },
            data: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone_number: { type: 'string' },
                language: { type: 'string', description: 'ISO 639-1 format (e.g., "sv", "en")' },
                tags: { type: 'array', items: { type: 'string' } },
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string', description: 'Format: GroupName.FieldName' },
                      value: {},
                      type: {
                        type: 'string',
                        enum: ['text', 'date', 'datetime', 'time', 'multiple', 'json']
                      }
                    },
                    required: ['key', 'value']
                  }
                }
              }
            }
          },
          required: ['identifier', 'data']
        }
      },
      {
        name: 'rule_delete_subscriber',
        description: 'Permanently delete a subscriber from Rule.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier']
        }
      },

      // TAG MANAGEMENT TOOLS
      {
        name: 'rule_add_subscriber_tags',
        description: 'Add one or more tags to a subscriber. Creates new tags if they don\'t exist. Triggers automation flows.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            tags: {
              type: 'array',
              items: { type: ['string', 'number'] },
              description: 'Tag names or IDs to add'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier', 'tags']
        }
      },
      {
        name: 'rule_get_subscriber_tags',
        description: 'Get all tags associated with a subscriber.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'rule_clear_subscriber_tags',
        description: 'Remove all tags from a subscriber (does not delete tags or subscriber).',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'rule_delete_subscriber_tag',
        description: 'Remove a specific tag from a subscriber (does not delete tag or subscriber).',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            tag_identifier: {
              type: 'string',
              description: 'Tag name or ID'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier', 'tag_identifier']
        }
      },

      // TAG TOOLS
      {
        name: 'rule_get_tags',
        description: 'Get all tags with pagination support.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of tags to fetch (max 100, default 100)',
              maximum: 100
            },
            page: {
              type: 'number',
              description: 'Page number for pagination'
            }
          }
        }
      },
      {
        name: 'rule_get_tag',
        description: 'Get detailed information about a specific tag, optionally with subscriber count.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Tag name or ID'
            },
            identified_by: {
              type: 'string',
              enum: ['name', 'id'],
              description: 'Type of identifier (default: name)'
            },
            with_count: {
              type: 'boolean',
              description: 'Include subscriber count (default: false)'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'rule_update_tag',
        description: 'Update tag name or description.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Tag name or ID'
            },
            data: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          required: ['identifier', 'data']
        }
      },
      {
        name: 'rule_delete_tag',
        description: 'Permanently delete a tag from Rule.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Tag name or ID'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'rule_clear_tag',
        description: 'Remove all subscribers from a tag (does not delete tag or subscribers).',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Tag name or ID'
            }
          },
          required: ['identifier']
        }
      },

      // SEGMENT TOOLS
      {
        name: 'rule_get_segments',
        description: 'Get all sync-at segments with pagination support.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of segments to fetch (max 100, default 100)',
              maximum: 100
            },
            page: {
              type: 'number',
              description: 'Page number for pagination'
            }
          }
        }
      },

      // TRANSACTION TOOLS
      {
        name: 'rule_send_transaction',
        description: 'Send transactional email or SMS. Emails require base64-encoded content. SMS charged at 0.40 SEK per message.',
        inputSchema: {
          type: 'object',
          properties: {
            transaction_type: {
              type: 'string',
              enum: ['email', 'text_message'],
              description: 'Type of transaction'
            },
            transaction_name: {
              type: 'string',
              description: 'Name for tracking this transaction'
            },
            subject: {
              type: 'string',
              description: 'Email subject (required for email)'
            },
            from: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', description: 'Required for email' }
              },
              required: ['name']
            },
            to: {
              type: 'object',
              description: 'Recipient info (email or phone_number required)',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                phone_number: { type: 'string' }
              }
            },
            content: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    plain: { type: 'string', description: 'Base64-encoded plain text' },
                    html: { type: 'string', description: 'Base64-encoded HTML' }
                  }
                },
                { type: 'string', description: 'SMS content' }
              ]
            },
            template_id: {
              type: 'number',
              description: 'Optional template ID for email'
            }
          },
          required: ['transaction_type', 'from', 'to', 'content']
        }
      },

      // TEMPLATE TOOLS
      {
        name: 'rule_get_templates',
        description: 'Get all available email templates.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'rule_get_template',
        description: 'Get detailed information about a specific template including supported blocks.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Template ID'
            }
          },
          required: ['id']
        }
      },

      // CAMPAIGN TOOLS
      {
        name: 'rule_get_campaigns',
        description: 'Get all campaigns with optional filtering by type, creation date, and send date.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of campaigns to fetch (max 100)',
              maximum: 100
            },
            type: {
              type: 'number',
              description: 'Message type: 1 (email), 2 (SMS)',
              enum: [1, 2]
            },
            created_from: {
              type: 'string',
              description: 'Created from date (YYYY-MM-DD)'
            },
            created_to: {
              type: 'string',
              description: 'Created to date (YYYY-MM-DD)'
            },
            sent_from: {
              type: 'string',
              description: 'Sent from date (YYYY-MM-DD)'
            },
            sent_to: {
              type: 'string',
              description: 'Sent to date (YYYY-MM-DD)'
            }
          }
        }
      },
      {
        name: 'rule_create_campaign',
        description: 'Create a new campaign (draft) with recipients, content, and optional template.',
        inputSchema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            message_type: {
              type: 'string',
              enum: ['email', 'text_message']
            },
            language: {
              type: 'string',
              description: 'ISO 639-1 format (e.g., "sv", "en")'
            },
            from: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' }
              },
              required: ['name']
            },
            recipients: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      identifier: { type: 'string' },
                      negative: { type: 'boolean', description: 'Exclude this tag' }
                    }
                  }
                },
                segments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      identifier: { type: 'string' },
                      negative: { type: 'boolean', description: 'Exclude this segment' }
                    }
                  }
                }
              }
            },
            content: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    plain: { type: 'string', description: 'Base64-encoded plain text' },
                    html: { type: 'string', description: 'Base64-encoded HTML' }
                  }
                },
                { type: 'string', description: 'SMS content' }
              ]
            },
            email_template_id: {
              type: 'number',
              description: 'Optional template ID'
            }
          },
          required: ['subject', 'message_type', 'from', 'recipients', 'content']
        }
      },
      {
        name: 'rule_get_campaign',
        description: 'Get detailed information about a specific campaign including recipients.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Campaign ID'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'rule_get_campaign_statistics',
        description: 'Get campaign statistics including sends, opens, clicks, bounces, and unsubscribes.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Campaign ID'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'rule_send_campaign',
        description: 'Send a campaign immediately. SMS campaigns cost 0.40 SEK per message.',
        inputSchema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            message_type: {
              type: 'string',
              enum: ['email', 'text_message']
            },
            language: { type: 'string' },
            from: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' }
              },
              required: ['name']
            },
            recipients: {
              type: 'object',
              properties: {
                tags: { type: 'array' },
                segments: { type: 'array' }
              }
            },
            content: {}
          },
          required: ['subject', 'message_type', 'from', 'recipients', 'content']
        }
      },
      {
        name: 'rule_schedule_campaign',
        description: 'Schedule a campaign to be sent at a specific date/time.',
        inputSchema: {
          type: 'object',
          properties: {
            send_at: {
              type: 'string',
              description: 'Send date/time (YYYY-MM-DD HH:MM:SS)'
            },
            subject: { type: 'string' },
            message_type: {
              type: 'string',
              enum: ['email', 'text_message']
            },
            language: { type: 'string' },
            from: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' }
              }
            },
            recipients: {
              type: 'object',
              properties: {
                tags: { type: 'array' },
                segments: { type: 'array' }
              }
            },
            content: {}
          },
          required: ['send_at', 'subject', 'message_type', 'from', 'recipients', 'content']
        }
      },
      {
        name: 'rule_delete_campaign',
        description: 'Permanently delete a campaign.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Campaign ID'
            }
          },
          required: ['id']
        }
      },

      // CUSTOM FIELD TOOLS
      {
        name: 'rule_create_groups_and_fields',
        description: 'Create new custom field groups and fields for subscriber data.',
        inputSchema: {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: {
                    type: 'string',
                    description: 'Format: GroupName.FieldName'
                  },
                  type: {
                    type: 'string',
                    enum: ['text', 'date', 'datetime', 'time', 'multiple', 'json'],
                    description: 'Field type (default: text)'
                  }
                },
                required: ['key']
              }
            }
          },
          required: ['fields']
        }
      },
      {
        name: 'rule_get_groups',
        description: 'Get all custom field groups with their fields.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of groups to fetch (max 100)',
              maximum: 100
            },
            page: {
              type: 'number',
              description: 'Page number for pagination'
            }
          }
        }
      },
      {
        name: 'rule_get_group',
        description: 'Get a specific custom field group with all its fields.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Group name or ID'
            }
          },
          required: ['identifier']
        }
      },

      // SUPPRESSION TOOLS
      {
        name: 'rule_get_suppressions',
        description: 'Get all suppressions (bounces, spam complaints, unsubscribes) with pagination.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of suppressions to fetch (max 100)',
              maximum: 100
            },
            page: {
              type: 'number',
              description: 'Page number for pagination'
            }
          }
        }
      },

      // PREFERENCE TOOLS
      {
        name: 'rule_get_preference_groups',
        description: 'Get all preference groups with their available preferences.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'rule_get_subscriber_preferences',
        description: 'Get a subscriber\'s preferences for a specific preference group.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            preference_group_id: {
              type: 'number',
              description: 'Preference group ID'
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier', 'preference_group_id']
        }
      },
      {
        name: 'rule_update_subscriber_preferences',
        description: 'Update a subscriber\'s opt-in/opt-out status for preferences in a group.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Email, phone number, or ID of the subscriber'
            },
            preference_group_id: {
              type: 'number',
              description: 'Preference group ID'
            },
            preferences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  preference_id: { type: 'number' },
                  is_opted_in: { type: 'boolean' }
                },
                required: ['preference_id', 'is_opted_in']
              }
            },
            identified_by: {
              type: 'string',
              enum: ['email', 'phone_number', 'id'],
              description: 'Type of identifier (default: email)'
            }
          },
          required: ['identifier', 'preference_group_id', 'preferences']
        }
      },

      // JOURNEY TOOLS
      {
        name: 'rule_get_journeys',
        description: 'Get all journeys (automation flows) with optional filtering by name or preference.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Filter by journey name'
            },
            preference_id: {
              type: 'number',
              description: 'Filter by preference group ID'
            }
          }
        }
      }
    ]
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      // SUBSCRIBER TOOLS
      case 'rule_create_subscribers':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.createSubscribers(args), null, 2)
            }
          ]
        };

      case 'rule_get_subscribers':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getSubscribers(args), null, 2)
            }
          ]
        };

      case 'rule_get_subscriber':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.getSubscriber(args.identifier, args.identified_by),
                null,
                2
              )
            }
          ]
        };

      case 'rule_get_subscriber_fields':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.getSubscriberFields(args.identifier, args.identified_by),
                null,
                2
              )
            }
          ]
        };

      case 'rule_update_subscriber':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.updateSubscriber(args.identifier, args.data),
                null,
                2
              )
            }
          ]
        };

      case 'rule_delete_subscriber':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.deleteSubscriber(args.identifier, args.identified_by),
                null,
                2
              )
            }
          ]
        };

      // TAG MANAGEMENT TOOLS
      case 'rule_add_subscriber_tags':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.addSubscriberTags(
                  args.identifier,
                  args.tags,
                  args.identified_by
                ),
                null,
                2
              )
            }
          ]
        };

      case 'rule_get_subscriber_tags':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.getSubscriberTags(args.identifier, args.identified_by),
                null,
                2
              )
            }
          ]
        };

      case 'rule_clear_subscriber_tags':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.clearSubscriberTags(args.identifier, args.identified_by),
                null,
                2
              )
            }
          ]
        };

      case 'rule_delete_subscriber_tag':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.deleteSubscriberTag(
                  args.identifier,
                  args.tag_identifier,
                  args.identified_by
                ),
                null,
                2
              )
            }
          ]
        };

      // TAG TOOLS
      case 'rule_get_tags':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getTags(args), null, 2)
            }
          ]
        };

      case 'rule_get_tag':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.getTag(
                  args.identifier,
                  args.identified_by,
                  args.with_count
                ),
                null,
                2
              )
            }
          ]
        };

      case 'rule_update_tag':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.updateTag(args.identifier, args.data),
                null,
                2
              )
            }
          ]
        };

      case 'rule_delete_tag':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.deleteTag(args.identifier), null, 2)
            }
          ]
        };

      case 'rule_clear_tag':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.clearTag(args.identifier), null, 2)
            }
          ]
        };

      // SEGMENT TOOLS
      case 'rule_get_segments':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getSegments(args), null, 2)
            }
          ]
        };

      // TRANSACTION TOOLS
      case 'rule_send_transaction':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.sendTransaction(args), null, 2)
            }
          ]
        };

      // TEMPLATE TOOLS
      case 'rule_get_templates':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getTemplates(), null, 2)
            }
          ]
        };

      case 'rule_get_template':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getTemplate(args.id), null, 2)
            }
          ]
        };

      // CAMPAIGN TOOLS
      case 'rule_get_campaigns':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getCampaigns(args), null, 2)
            }
          ]
        };

      case 'rule_create_campaign':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.createCampaign(args), null, 2)
            }
          ]
        };

      case 'rule_get_campaign':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getCampaign(args.id), null, 2)
            }
          ]
        };

      case 'rule_get_campaign_statistics':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getCampaignStatistics(args.id), null, 2)
            }
          ]
        };

      case 'rule_send_campaign':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.sendCampaign(args), null, 2)
            }
          ]
        };

      case 'rule_schedule_campaign':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.scheduleCampaign(args), null, 2)
            }
          ]
        };

      case 'rule_delete_campaign':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.deleteCampaign(args.id), null, 2)
            }
          ]
        };

      // CUSTOM FIELD TOOLS
      case 'rule_create_groups_and_fields':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.createGroupsAndFields(args), null, 2)
            }
          ]
        };

      case 'rule_get_groups':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getGroups(args), null, 2)
            }
          ]
        };

      case 'rule_get_group':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getGroup(args.identifier), null, 2)
            }
          ]
        };

      // SUPPRESSION TOOLS
      case 'rule_get_suppressions':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getSuppressions(args), null, 2)
            }
          ]
        };

      // PREFERENCE TOOLS
      case 'rule_get_preference_groups':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getPreferenceGroups(), null, 2)
            }
          ]
        };

      case 'rule_get_subscriber_preferences':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.getSubscriberPreferences(
                  args.identifier,
                  args.preference_group_id,
                  args.identified_by
                ),
                null,
                2
              )
            }
          ]
        };

      case 'rule_update_subscriber_preferences':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ruleClient.updateSubscriberPreferences(
                  args.identifier,
                  args.preference_group_id,
                  { preferences: args.preferences },
                  args.identified_by
                ),
                null,
                2
              )
            }
          ]
        };

      // JOURNEY TOOLS
      case 'rule_get_journeys':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await ruleClient.getJourneys(args), null, 2)
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

} // end setupHandlers

// Start the server
async function main() {
  const port = process.env.PORT;

  if (port) {
    // HTTP mode for Railway / remote hosting
    const httpServer = createServer(async (req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      if (req.url === '/mcp' || req.url === '/') {
        const authHeader = req.headers['authorization'] || '';
        const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!apiKey) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing Authorization header. Use: Authorization: Bearer <RULE_API_KEY>' }));
          return;
        }
        const ruleClient = new RuleAPIClient(apiKey);
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        const mcpServer = createMCPServer(ruleClient);
        res.on('close', () => {
          transport.close();
        });
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    httpServer.listen(Number(port), () => {
      console.error(`Rule MCP Server running on http://0.0.0.0:${port}/mcp`);
    });
  } else {
    // Stdio mode for local usage
    const apiKey = process.env.RULE_API_KEY;
    if (!apiKey) {
      console.error('Error: RULE_API_KEY environment variable is required');
      process.exit(1);
    }
    const ruleClient = new RuleAPIClient(apiKey);
    const mcpServer = createMCPServer(ruleClient);
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('Rule MCP Server running on stdio');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
