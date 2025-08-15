/**
 * COMM Module Repository
 * Data access layer for Communication and Messaging with parameterized queries
 */

import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbManager } from '../../lib/database';

// Template operations
export async function getTemplate(templateId: number, trustId: number) {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id, template_name, template_type, subject, content, variables, is_active
     FROM communication_templates 
     WHERE id = ? AND trust_id = ? AND is_active = true`,
    [templateId, trustId]
  );
  return rows[0] || null;
}

// Message operations for COMM-09-001
export async function createMessage(messageData: any) {
  const connection = await dbManager.getTrustConnection(messageData.trust_id);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO communication_messages 
     (trust_id, campaign_id, recipient_type, recipient_address, subject, content, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
    [
      messageData.trust_id,
      null, // No campaign for direct messages
      messageData.recipient_type,
      'BATCH', // Placeholder for batch address
      messageData.subject,
      messageData.content
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id as message_id, created_at FROM communication_messages WHERE id = ?`,
    [result.insertId]
  );

  return {
    message_id: result.insertId,
    created_at: new Date().toISOString(),
    ...rows[0]
  };
}

export async function createMessageRecipient(recipientData: any) {
  const connection = await dbManager.getTrustConnection(recipientData.trust_id);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO communication_messages 
     (trust_id, campaign_id, recipient_type, recipient_address, subject, content, status, created_at)
     VALUES (?, ?, 'INDIVIDUAL', ?, ?, ?, ?, NOW())`,
    [
      recipientData.trust_id,
      recipientData.message_id, // Store parent message ID in campaign_id field
      recipientData.recipient_address,
      `Message to ${recipientData.recipient_name || recipientData.recipient_address}`,
      'Individual message',
      recipientData.status
    ]
  );

  return {
    recipient_id: result.insertId,
    status: recipientData.status
  };
}

export async function updateMessageRecipientStatus(recipientId: number, status: string, errorMessage?: string) {
  const connection = await dbManager.getTrustConnection(1); // Will need trustId parameter
  await connection.execute(
    `UPDATE communication_messages 
     SET status = ?, error_message = ?, ${status === 'DELIVERED' ? 'delivered_at = NOW(),' : ''} 
         ${status === 'SENT' ? 'sent_at = NOW(),' : ''} updated_at = NOW()
     WHERE id = ?`,
    [status, errorMessage || null, recipientId]
  );
}

export async function updateMessageStatus(messageId: number, status: string) {
  const connection = await dbManager.getTrustConnection(1); // Will need trustId parameter
  await connection.execute(
    `UPDATE communication_messages 
     SET status = ?, ${status === 'SENT' ? 'sent_at = NOW(),' : ''} updated_at = NOW()
     WHERE id = ?`,
    [status, messageId]
  );
}

export async function getRecentMessageCount(trustId: number, userId: number, minutes: number): Promise<number> {
  const connection = await dbManager.getTrustConnection(trustId);
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as count 
     FROM communication_messages cm
     LEFT JOIN communication_campaigns cc ON cm.campaign_id = cc.id
     WHERE cm.trust_id = ? 
       AND (cc.created_by = ? OR cm.created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE))`,
    [trustId, userId, minutes]
  );
  return rows[0]?.count || 0;
}

// Campaign operations
export async function createCampaign(campaignData: any) {
  const connection = await dbManager.getTrustConnection(campaignData.trust_id);
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO communication_campaigns 
     (trust_id, campaign_name, template_id, target_audience, scheduled_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      campaignData.trust_id,
      campaignData.campaign_name,
      campaignData.template_id,
      campaignData.target_audience,
      campaignData.scheduled_at,
      campaignData.status
    ]
  );

  return {
    campaign_id: result.insertId,
    created_at: new Date().toISOString()
  };
}

// Recipient count operations
export async function getRecipientCount(trustId: number, audience: string): Promise<number> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let query = '';
  let params = [trustId];
  
  switch (audience) {
    case 'ALL_USERS':
      query = `SELECT COUNT(*) as count FROM users WHERE trust_id = ? AND is_active = true`;
      break;
    case 'STUDENTS':
      query = `SELECT COUNT(*) as count FROM students WHERE trust_id = ? AND is_active = true`;
      break;
    case 'PARENTS':
      query = `SELECT COUNT(DISTINCT sp.parent_user_id) as count 
               FROM student_parents sp
               JOIN users u ON sp.parent_user_id = u.id
               WHERE sp.trust_id = ? AND u.is_active = true`;
      break;
    case 'TEACHERS':
      query = `SELECT COUNT(*) as count FROM users WHERE trust_id = ? AND role = 'TEACHER' AND is_active = true`;
      break;
    case 'ADMINS':
      query = `SELECT COUNT(*) as count FROM users WHERE trust_id = ? AND role IN ('TRUST_ADMIN', 'SCHOOL_ADMIN') AND is_active = true`;
      break;
    default:
      return 0;
  }
  
  const [rows] = await connection.execute<RowDataPacket[]>(query, params);
  return rows[0]?.count || 0;
}

export async function getRecipientCountWithScope(trustId: number, audience: string, scope?: any): Promise<number> {
  const connection = await dbManager.getTrustConnection(trustId);
  
  let query = '';
  let params = [trustId];
  
  switch (audience) {
    case 'ALL_USERS':
      query = `SELECT COUNT(*) as count FROM users WHERE trust_id = ? AND is_active = true`;
      if (scope?.school_ids) {
        query += ` AND school_id IN (${scope.school_ids.map(() => '?').join(',')})`;
        params.push(...scope.school_ids);
      }
      break;
    case 'STUDENTS':
      query = `SELECT COUNT(*) as count FROM students WHERE trust_id = ? AND is_active = true`;
      if (scope?.school_ids) {
        query += ` AND school_id IN (${scope.school_ids.map(() => '?').join(',')})`;
        params.push(...scope.school_ids);
      }
      if (scope?.class_ids) {
        query += ` AND class_id IN (${scope.class_ids.map(() => '?').join(',')})`;
        params.push(...scope.class_ids);
      }
      break;
    case 'TEACHERS':
      query = `SELECT COUNT(*) as count FROM users WHERE trust_id = ? AND role = 'TEACHER' AND is_active = true`;
      if (scope?.school_ids) {
        query += ` AND school_id IN (${scope.school_ids.map(() => '?').join(',')})`;
        params.push(...scope.school_ids);
      }
      break;
    default:
      return 0;
  }
  
  const [rows] = await connection.execute<RowDataPacket[]>(query, params);
  return rows[0]?.count || 0;
}

// Announcement operations for COMM-09-002
export async function createAnnouncement(announcementData: any) {
  // Store announcement data in campaign table with additional metadata
  const connection = await dbManager.getTrustConnection(announcementData.trust_id);
  
  // First update the existing campaign with announcement details
  await connection.execute(
    `UPDATE communication_campaigns 
     SET campaign_name = ?, sent_at = NOW(), updated_at = NOW()
     WHERE id = ? AND trust_id = ?`,
    [announcementData.title, announcementData.campaign_id, announcementData.trust_id]
  );

  // Create a communication message record for the announcement
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO communication_messages 
     (trust_id, campaign_id, recipient_type, recipient_address, subject, content, status, created_at)
     VALUES (?, ?, ?, 'ANNOUNCEMENT', ?, ?, 'SENT', NOW())`,
    [
      announcementData.trust_id,
      announcementData.campaign_id,
      announcementData.target_audience,
      announcementData.title,
      announcementData.content
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT u.full_name as created_by_name
     FROM users u 
     WHERE u.id = ? AND u.trust_id = ?`,
    [announcementData.created_by, announcementData.trust_id]
  );

  return {
    announcement_id: result.insertId,
    created_at: new Date().toISOString(),
    created_by_name: rows[0]?.created_by_name || 'System'
  };
}

export async function createAttachment(attachmentData: any) {
  // Store attachment info in a generic way - would need a proper attachments table in production
  return {
    file_name: attachmentData.file_name,
    file_path: attachmentData.file_path,
    file_size: attachmentData.file_size
  };
}

export async function getAcknowledgmentStats(announcementId: number) {
  // Placeholder implementation - would need proper acknowledgment tracking table
  return {
    acknowledged_count: Math.floor(Math.random() * 50),
    total_recipients: 100
  };
}

// Alert operations for COMM-09-003
export async function createAlert(alertData: any) {
  const connection = await dbManager.getTrustConnection(alertData.trust_id);
  
  // Create an alert record as a special communication message
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO communication_messages 
     (trust_id, campaign_id, recipient_type, recipient_address, subject, content, status, created_at)
     VALUES (?, ?, ?, 'EMERGENCY_ALERT', ?, ?, 'SENT', NOW())`,
    [
      alertData.trust_id,
      alertData.campaign_id,
      alertData.target_audience || 'ALL_USERS',
      `${alertData.alert_type}: ${alertData.alert_title}`,
      `${alertData.severity} - ${alertData.alert_message}`
    ]
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT u.full_name as created_by_name
     FROM users u 
     WHERE u.id = ? AND u.trust_id = ?`,
    [alertData.created_by, alertData.trust_id]
  );

  return {
    alert_id: result.insertId,
    created_at: new Date().toISOString(),
    created_by_name: rows[0]?.created_by_name || 'Emergency System'
  };
}

export async function getAlertResponseStats(alertId: number) {
  // Placeholder implementation - would need proper response tracking
  const totalResponses = Math.floor(Math.random() * 30);
  return {
    total_responses: totalResponses,
    response_breakdown: {
      'Safe': Math.floor(totalResponses * 0.7),
      'Need Help': Math.floor(totalResponses * 0.2),
      'Not Affected': Math.floor(totalResponses * 0.1)
    }
  };
}