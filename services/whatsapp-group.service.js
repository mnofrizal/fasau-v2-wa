import logger from "../config/logger.js";

// Get all WhatsApp groups
const getGroupList = async (sock) => {
  try {
    if (!sock) {
      throw new Error("WhatsApp socket is not available");
    }

    logger.info("📋 Fetching group list...");

    // Get all chats
    const chats = await sock.groupFetchAllParticipating();

    // Format group data
    const groups = Object.values(chats).map((group) => ({
      id: group.id,
      name: group.subject,
      description: group.desc || "",
      participantsCount: group.participants?.length || 0,
      isAdmin:
        group.participants?.some(
          (p) =>
            p.id === sock.user?.id &&
            (p.admin === "admin" || p.admin === "superadmin")
        ) || false,
      createdAt: group.creation
        ? new Date(group.creation * 1000).toISOString()
        : null,
      createdBy: group.subjectOwner || "",
      participants:
        group.participants?.map((p) => ({
          id: p.id,
          isAdmin: p.admin === "admin" || p.admin === "superadmin",
          isSuperAdmin: p.admin === "superadmin",
        })) || [],
    }));

    logger.info(`✅ Retrieved ${groups.length} groups`);

    return {
      success: true,
      count: groups.length,
      groups: groups,
    };
  } catch (error) {
    logger.error("❌ Error fetching group list:", error);
    throw error;
  }
};

// Send message to group
const sendGroupMessage = async (sock, groupId, message) => {
  try {
    if (!sock) {
      throw new Error("WhatsApp socket is not available");
    }

    // Ensure group ID has proper format
    const jid = groupId.includes("@g.us") ? groupId : `${groupId}@g.us`;

    logger.info(`📤 Sending message to group: ${groupId}`);

    const result = await sock.sendMessage(jid, { text: message });

    logger.info(`✅ Message sent to group: ${groupId}`);

    return {
      success: true,
      messageId: result.key.id,
      to: jid,
      message: message,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`❌ Error sending message to group ${groupId}:`, error);
    throw error;
  }
};

export { getGroupList, sendGroupMessage };
