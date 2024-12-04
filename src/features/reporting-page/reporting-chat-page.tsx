"use client";

import {
  ChatDocumentModel,
  ChatMessageModel,
} from "@/features/chat-page/chat-services/models";
import { ChatMessageArea } from "@/features/ui/chat/chat-message-area/chat-message-area";
import ChatMessageContainer from "@/features/ui/chat/chat-message-area/chat-message-container";
import ChatMessageContentArea from "@/features/ui/chat/chat-message-area/chat-message-content";
import MessageContent from "../chat-page/message-content";
import { AI_ICON_URL } from "@/features/theme/theme-config";

interface ReportingChatPageProps {
  messages: Array<ChatMessageModel>;
  chatDocuments: Array<ChatDocumentModel>;
}

export default function ReportingChatPage(props: ReportingChatPageProps) {
  return (
    <main className="flex flex-1 relative flex-col">
      <ChatMessageContainer>
        <ChatMessageContentArea>
          {props.messages.map((message) => (
            <ChatMessageArea
              key={message.id}
              profileName={message.name}
              role={message.role}
              onCopy={() => navigator.clipboard.writeText(message.content)}
              profilePicture={
                message.role === "assistant" ? AI_ICON_URL : undefined
              }
            >
              <MessageContent message={message} />
            </ChatMessageArea>
          ))}
        </ChatMessageContentArea>
      </ChatMessageContainer>
    </main>
  );
}
