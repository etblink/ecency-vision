import { useMutation } from "@tanstack/react-query";
import { createPatch } from "../../../helper/posting";
import { proxifyImageSrc } from "@ecency/render-helper";
import { comment, formatError } from "../../../api/operations";
import { Entry } from "../../../store/entries/types";
import { correctIsoDate } from "../../../helper/temp-entry";
import moment from "moment/moment";
import { error, success } from "../../../components/feedback";
import { _t } from "../../../i18n";
import { makePath as makePathEntry } from "../../../components/entry-link";
import { useMappedStore } from "../../../store/use-mapped-store";
import { History } from "history";
import { buildMetadata } from "../functions";
import { useThreeSpeakManager } from "../hooks";

export function useUpdateApi(history: History, onClear: () => void) {
  const { activeUser, updateEntry } = useMappedStore();

  const {
    videoId,
    is3Speak: isThreespeak,
    speakPermlink,
    speakAuthor,
    isNsfw,
    videoMetadata
  } = useThreeSpeakManager();

  const getHeightAndWidthFromDataUrl = (dataURL: string) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve((img.width / img.height).toFixed(4));
      };
      img.onerror = function () {
        resolve(0);
      };
      img.src = dataURL;
    });

  return useMutation(
    ["update"],
    async ({
      title,
      tags,
      body,
      description,
      editingEntry,
      selectionTouched,
      selectedThumbnail
    }: {
      title: string;
      tags: string[];
      body: string;
      description: string | null;
      editingEntry: Entry;
      selectionTouched: boolean;
      selectedThumbnail?: string;
    }) => {
      if (!editingEntry) {
        return;
      }

      const { body: oldBody, author, permlink, category, json_metadata } = editingEntry;
      // clean and copy body
      let newBody = body.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
      const patch = createPatch(oldBody, newBody.trim());
      if (patch && patch.length < Buffer.from(editingEntry.body, "utf-8").length) {
        newBody = patch;
      }

      let jsonMeta = Object.assign(
        {},
        json_metadata,
        buildMetadata({
          title,
          body,
          tags,
          description,
          videoMetadata,
          selectionTouched,
          selectedThumbnail
        }),
        { tags },
        { description }
      );

      if (jsonMeta && jsonMeta.image && jsonMeta.image.length > 0) {
        jsonMeta.image_ratios = await Promise.all(
          jsonMeta.image
            .slice(0, 5)
            .map((element: string) => getHeightAndWidthFromDataUrl(proxifyImageSrc(element)))
        );
      }

      try {
        await comment(
          activeUser?.username!,
          "",
          category,
          permlink,
          title,
          newBody,
          jsonMeta,
          null
        );

        // Update the entry object in store
        const entry: Entry = {
          ...editingEntry,
          title,
          body,
          category: tags[0],
          json_metadata: jsonMeta,
          updated: correctIsoDate(moment().toISOString())
        };
        updateEntry(entry);

        onClear();
        success(_t("submit.updated"));
        const newLoc = makePathEntry(category, author, permlink);
        history.push(newLoc);
      } catch (e) {
        error(...formatError(e));
      }
    }
  );
}
