/**
 * COMM Module Services
 * Business logic layer for Communication and Messaging
 */

import type {
  Comm09001RequestT,
  Comm09001ResponseT,
  Comm09002RequestT,
  Comm09002ResponseT,
  Comm09003RequestT,
  Comm09003ResponseT,
} from './dtos';
import * as repo from './repos';

// COMM-09-001: Notifications (SMS/Email/WhatsApp)
export async function comm_09_001Service(input: Comm09001RequestT, trustId: number, userId: number): Promise<Comm09001ResponseT> {
  const { 
    message_type, 
    template_id, 
    recipient_type, 
    recipients, 
    subject, 
    content, 
    variables, 
    schedule_at, 
    priority, 
    track_delivery 
  } = input;

  // Business validation
  if (recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }

  // Validate recipient format based on message type
  for (const recipient of recipients) {
    if (message_type === 'SMS' && !recipient.phone) {
      throw new Error('Phone number is required for SMS messages');
    }
    if (message_type === 'EMAIL' && !recipient.email) {
      throw new Error('Email address is required for EMAIL messages');
    }
    if (message_type === 'WHATSAPP' && !recipient.phone) {
      throw new Error('Phone number is required for WhatsApp messages');
    }
  }

  // If using template, validate and merge content
  let finalContent = content;
  let finalSubject = subject;
  
  if (template_id) {
    const template = await repo.getTemplate(template_id, trustId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Merge template with variables
    finalContent = mergeTemplateVariables(template.content, variables || {});
    finalSubject = template.subject ? mergeTemplateVariables(template.subject, variables || {}) : subject;
  }

  // Rate limiting check
  const recentMessageCount = await repo.getRecentMessageCount(trustId, userId, 60); // last 60 minutes
  if (recentMessageCount > 100) { // Max 100 messages per hour per user
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Create message record
  const messageRecord = await repo.createMessage({
    trust_id: trustId,
    created_by: userId,
    message_type,
    template_id,
    recipient_type,
    subject: finalSubject,
    content: finalContent,
    priority,
    schedule_at,
    track_delivery
  });

  // Process recipients and send messages
  const recipientResults = [];
  let sentCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      const recipientRecord = await repo.createMessageRecipient({
        message_id: messageRecord.message_id,
        trust_id: trustId,
        user_id: recipient.user_id,
        recipient_address: recipient.phone || recipient.email || '',
        recipient_name: recipient.name,
        status: schedule_at ? 'PENDING' : 'SENT'
      });

      // Send message if not scheduled
      if (!schedule_at) {
        const deliveryResult = await sendMessage(message_type, {
          address: recipient.phone || recipient.email || '',
          subject: finalSubject,
          content: finalContent
        });

        await repo.updateMessageRecipientStatus(recipientRecord.recipient_id, 
          deliveryResult.success ? 'DELIVERED' : 'FAILED',
          deliveryResult.error
        );

        if (deliveryResult.success) {
          deliveredCount++;
        } else {
          failedCount++;
        }
        sentCount++;
      }

      recipientResults.push({
        recipient_id: recipientRecord.recipient_id,
        recipient_address: recipient.phone || recipient.email || '',
        recipient_name: recipient.name,
        status: recipientRecord.status as any,
        sent_at: !schedule_at ? new Date().toISOString() : undefined,
        delivered_at: deliveredCount > failedCount ? new Date().toISOString() : undefined,
        error_message: undefined
      });
    } catch (error: any) {
      failedCount++;
      recipientResults.push({
        recipient_id: 0,
        recipient_address: recipient.phone || recipient.email || '',
        recipient_name: recipient.name,
        status: 'FAILED' as any,
        sent_at: undefined,
        delivered_at: undefined,
        error_message: error.message
      });
    }
  }

  // Update message status
  const finalStatus = schedule_at ? 'PENDING' : (failedCount === recipients.length ? 'FAILED' : 'SENT');
  await repo.updateMessageStatus(messageRecord.message_id, finalStatus as any);

  return {
    message_id: messageRecord.message_id,
    batch_id: `BATCH_${messageRecord.message_id}_${Date.now()}`,
    message_type,
    total_recipients: recipients.length,
    content: finalContent,
    status: finalStatus as any,
    scheduled_at: schedule_at,
    sent_at: !schedule_at ? new Date().toISOString() : undefined,
    recipients: recipientResults,
    delivery_stats: {
      total_sent: sentCount,
      total_delivered: deliveredCount,
      total_failed: failedCount,
      delivery_rate: sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0
    },
    created_at: messageRecord.created_at
  };
}

// COMM-09-002: In-app announcements
export async function comm_09_002Service(input: Comm09002RequestT, trustId: number, userId: number): Promise<Comm09002ResponseT> {
  const { 
    title, 
    content, 
    target_audience, 
    specific_recipients, 
    priority, 
    display_from, 
    display_until, 
    is_dismissible, 
    requires_acknowledgment, 
    category, 
    attachments 
  } = input;

  // Business validation
  if (display_from && display_until && new Date(display_until) <= new Date(display_from)) {
    throw new Error('Display until date must be after display from date');
  }

  // Get recipient count
  let totalRecipients = 0;
  if (target_audience === 'CUSTOM' && specific_recipients) {
    totalRecipients = specific_recipients.length;
  } else {
    totalRecipients = await repo.getRecipientCount(trustId, target_audience);
  }

  // Create announcement campaign
  const campaign = await repo.createCampaign({
    trust_id: trustId,
    campaign_name: title,
    template_id: null,
    target_audience,
    scheduled_at: display_from,
    created_by: userId,
    status: 'SENT'
  });

  // Create announcement record  
  const announcement = await repo.createAnnouncement({
    trust_id: trustId,
    campaign_id: campaign.campaign_id,
    title,
    content,
    priority,
    category,
    display_from,
    display_until,
    is_dismissible,
    requires_acknowledgment,
    created_by: userId
  });

  // Handle file attachments
  let processedAttachments = [];
  if (attachments) {
    for (const attachment of attachments) {
      const attachmentRecord = await repo.createAttachment({
        announcement_id: announcement.announcement_id,
        trust_id: trustId,
        file_name: attachment.file_name,
        file_path: attachment.file_path,
        file_size: attachment.file_size
      });
      processedAttachments.push(attachmentRecord);
    }
  }

  // Get acknowledgment stats if required
  let acknowledgmentStats;
  if (requires_acknowledgment) {
    const stats = await repo.getAcknowledgmentStats(announcement.announcement_id);
    acknowledgmentStats = {
      total_recipients: totalRecipients,
      acknowledged_count: stats.acknowledged_count || 0,
      pending_count: totalRecipients - (stats.acknowledged_count || 0),
      acknowledgment_rate: totalRecipients > 0 ? ((stats.acknowledged_count || 0) / totalRecipients) * 100 : 0
    };
  }

  return {
    announcement_id: announcement.announcement_id,
    title,
    content,
    target_audience,
    priority,
    category,
    total_recipients: totalRecipients,
    display_from,
    display_until,
    is_active: true,
    requires_acknowledgment,
    acknowledgment_stats: acknowledgmentStats,
    attachments: processedAttachments,
    created_at: announcement.created_at,
    created_by: announcement.created_by_name || 'System'
  };
}

// COMM-09-003: Emergency alerts (broadcast)
export async function comm_09_003Service(input: Comm09003RequestT, trustId: number, userId: number): Promise<Comm09003ResponseT> {
  const { 
    alert_title, 
    alert_message, 
    alert_type, 
    severity, 
    channels, 
    target_audience, 
    specific_recipients, 
    geographic_scope, 
    auto_escalate, 
    escalation_delay_minutes, 
    requires_response, 
    response_options, 
    expires_at 
  } = input;

  // Business validation
  if (severity === 'EMERGENCY' && !channels.includes('SMS')) {
    throw new Error('Emergency alerts must include SMS channel');
  }

  if (requires_response && (!response_options || response_options.length === 0)) {
    throw new Error('Response options are required when response is enabled');
  }

  // Get recipient count based on audience and scope
  let totalRecipients = 0;
  if (target_audience === 'CUSTOM' && specific_recipients) {
    totalRecipients = specific_recipients.length;
  } else {
    totalRecipients = await repo.getRecipientCountWithScope(trustId, target_audience, geographic_scope);
  }

  // Create emergency campaign
  const campaign = await repo.createCampaign({
    trust_id: trustId,
    campaign_name: `Emergency Alert: ${alert_title}`,
    template_id: null,
    target_audience,
    scheduled_at: new Date().toISOString(),
    created_by: userId,
    status: 'SENT'
  });

  // Create alert record
  const alert = await repo.createAlert({
    trust_id: trustId,
    campaign_id: campaign.campaign_id,
    alert_title,
    alert_message,
    alert_type,
    severity,
    channels: channels.join(','),
    auto_escalate,
    escalation_delay_minutes,
    requires_response,
    response_options: response_options?.join(','),
    expires_at,
    created_by: userId
  });

  // Broadcast across all specified channels
  const broadcastStats = {
    sms_sent: 0,
    emails_sent: 0,
    whatsapp_sent: 0,
    in_app_sent: 0,
    total_delivered: 0,
    total_failed: 0,
    delivery_rate: 0
  };

  for (const channel of channels) {
    try {
      const result = await broadcastAlert(channel, {
        title: alert_title,
        message: alert_message,
        severity,
        trustId,
        target_audience,
        specific_recipients,
        geographic_scope
      });

      switch (channel) {
        case 'SMS':
          broadcastStats.sms_sent = result.sent;
          break;
        case 'EMAIL':
          broadcastStats.emails_sent = result.sent;
          break;
        case 'WHATSAPP':
          broadcastStats.whatsapp_sent = result.sent;
          break;
        case 'IN_APP':
          broadcastStats.in_app_sent = result.sent;
          break;
      }

      broadcastStats.total_delivered += result.delivered;
      broadcastStats.total_failed += result.failed;
    } catch (error) {
      console.error(`Failed to broadcast on ${channel}:`, error);
      broadcastStats.total_failed += totalRecipients;
    }
  }

  const totalSent = broadcastStats.sms_sent + broadcastStats.emails_sent + 
                   broadcastStats.whatsapp_sent + broadcastStats.in_app_sent;
  broadcastStats.delivery_rate = totalSent > 0 ? (broadcastStats.total_delivered / totalSent) * 100 : 0;

  // Get response stats if response is required
  let responseStats;
  if (requires_response) {
    const stats = await repo.getAlertResponseStats(alert.alert_id);
    responseStats = {
      total_responses: stats.total_responses || 0,
      response_rate: totalRecipients > 0 ? ((stats.total_responses || 0) / totalRecipients) * 100 : 0,
      response_breakdown: stats.response_breakdown || {}
    };
  }

  return {
    alert_id: alert.alert_id,
    campaign_id: campaign.campaign_id,
    alert_title,
    alert_message,
    alert_type,
    severity,
    channels,
    total_recipients: totalRecipients,
    broadcast_stats: broadcastStats,
    response_stats: responseStats,
    status: 'SENT' as any,
    sent_at: new Date().toISOString(),
    expires_at,
    created_at: alert.created_at,
    created_by: alert.created_by_name || 'System'
  };
}

// Helper functions
function mergeTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

async function sendMessage(type: string, message: { address: string; subject?: string; content: string }): Promise<{ success: boolean; error?: string }> {
  // This is a mock implementation - in production you'd integrate with actual SMS/Email/WhatsApp providers
  console.log(`Sending ${type} message to ${message.address}: ${message.content}`);
  
  // Simulate some failures for testing
  if (Math.random() < 0.05) { // 5% failure rate
    return { success: false, error: 'Service temporarily unavailable' };
  }
  
  return { success: true };
}

async function broadcastAlert(channel: string, alert: any): Promise<{ sent: number; delivered: number; failed: number }> {
  // This is a mock implementation - in production you'd integrate with actual broadcast services
  console.log(`Broadcasting ${channel} alert: ${alert.title}`);
  
  // Simulate broadcast results
  const sent = Math.floor(Math.random() * 100) + 50;
  const delivered = Math.floor(sent * 0.95); // 95% delivery rate
  const failed = sent - delivered;
  
  return { sent, delivered, failed };
}
