import React from "react";
import { Box, Text } from "@adminjs/design-system";

/**
 * Component to display a preview of reply text in the list view
 */
const ReplyTextPreview = (props) => {
  const { record } = props;
  const replyText = record.params.replyText;

  if (!replyText) {
    return (
      <Box>
        <Text color="grey40" fontSize="sm">
          No reply text
        </Text>
      </Box>
    );
  }

  // Show first 100 characters
  const preview = replyText.length > 100 
    ? replyText.substring(0, 100) + "..." 
    : replyText;

  return (
    <Box>
      <Text fontSize="sm">{preview}</Text>
    </Box>
  );
};

export default ReplyTextPreview;

