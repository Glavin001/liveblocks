"use client";

import {
  Composer,
  ComposerSubmitComment,
} from "@liveblocks/react-ui/primitives";
import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { useCreateThread, useSelf } from "@liveblocks/react/suspense";
import { formatTime } from "./Duration";
import styles from "./NewThreadComposer.module.css";
import { TimeIcon } from "./icons/Time";

type Props = {
  componentId: string;
  getCurrentPercentage: () => number;
  setPlaying: (vale: boolean) => void;
  time: number;
};

export function NewThreadComposer({
  componentId,
  getCurrentPercentage,
  setPlaying,
  time,
}: Props) {
  const currentUser = useSelf();
  const createThread = useCreateThread();
  const [attachTime, setAttachTime] = useState(true);

  // Submit thread with current time and componentId
  const handleSubmit = useCallback(
    ({ body }: ComposerSubmitComment, event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      createThread({
        body,
        metadata: {
          componentId,
          time: attachTime ? time : -1,
          timePercentage: attachTime ? getCurrentPercentage() : -1,
        },
      });
    },
    [attachTime, componentId, getCurrentPercentage, time, createThread]
  );

  // Pause video on focus
  const handleFocus = useCallback(() => {
    setPlaying(false);
  }, [setPlaying]);

  // Stop keyboard events firing on window when typing
  const handleKeyDown = useCallback((event: FormEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  const handleCheckboxChecked = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setAttachTime(event.target.checked);
    },
    []
  );

  return (
    <Composer.Form onComposerSubmit={handleSubmit} className={styles.wrapper}>
      <div className={styles.composer}>
        {currentUser && (
          <img
            className={styles.composerAvatar}
            width={24}
            height={24}
            src={currentUser.info.avatar}
            alt={currentUser.info.name}
          />
        )}
        <Composer.Editor
          className={styles.composerEditor}
          placeholder="Add comment…"
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.options}>
        <label htmlFor="attach-time" className={styles.optionsTime}>
          <span>
            <TimeIcon />
            {formatTime(time)}
          </span>
          <input
            id="attach-time"
            className={styles.checkbox}
            type="checkbox"
            checked={attachTime}
            onChange={handleCheckboxChecked}
          />
        </label>
        <Composer.Submit className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
          Comment
        </Composer.Submit>
      </div>
    </Composer.Form>
  );
}
