import React from 'react';
import { Badge } from '@adminjs/design-system';

const PreferredCommunicationList = (props) => {
  const { record } = props;
  const preferredCommunication = record.params.preferredCommunication || [];

  // Handle empty or invalid data
  if (!Array.isArray(preferredCommunication) || preferredCommunication.length === 0) {
    return <Badge variant="default">None</Badge>;
  }

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {preferredCommunication.includes('whatsapp') && (
        <Badge variant="primary">💬 WhatsApp</Badge>
      )}
      {preferredCommunication.includes('email') && (
        <Badge variant="info">📧 Email</Badge>
      )}
    </div>
  );
};

export default PreferredCommunicationList;

