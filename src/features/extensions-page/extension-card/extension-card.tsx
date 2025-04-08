"use client";

import { Button } from "@/features/ui/button";
import { Pencil, LockIcon, GlobeIcon, CheckCircleIcon } from "lucide-react";
import { FC } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { ExtensionModel } from "../extension-services/models";
import { extensionStore } from "../extension-store";
import { ExtensionCardContextMenu } from "./extension-context-menu";
import { StartNewExtensionChat } from "./start-new-extension-chat";

interface Props {
  extension: ExtensionModel;
  showContextMenu: boolean;
}

export const ExtensionCard: FC<Props> = (props) => {
  const { extension } = props;
  return (
    <Card key={extension.id} className="flex flex-col">
      <CardHeader className="flex flex-row">
        <CardTitle className="flex-1">{extension.name}</CardTitle>
        
        {props.showContextMenu && (
          <div>
            <ExtensionCardContextMenu extension={extension} />
          </div>
        )}
      </CardHeader>
      <CardContent className="text-muted-foreground flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {extension.isPrivate ? (
            <div className="flex items-center">
              <LockIcon className="h-3 w-3 mr-1" />
              <span>Private</span>
            </div>
          ) : (
            <div className="flex items-center">
              <GlobeIcon className="h-3 w-3 mr-1" />
              <span>Public</span>
            </div>
          )}
          
          {extension.isPublished && (
            <div className="flex items-center">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              <span>Published</span>
            </div>
          )}
        </div>
        <div className="h-1">
          {extension.description}
        </div>
      </CardContent>
      <CardFooter className="gap-1 content-stretch f">
        {props.showContextMenu && (
          <Button
            variant={"outline"}
            title="Show message"
            onClick={() => extensionStore.openAndUpdate(props.extension)}
          >
            <Pencil size={18} />
          </Button>
        )}

        <StartNewExtensionChat extension={extension} />
      </CardFooter>
    </Card>
  );
};
