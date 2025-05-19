'use client';
import React, {
  useState,
  cloneElement,
  isValidElement,
  ReactElement,
} from 'react';
import EmojiPicker, {
  EmojiClickData,
  EmojiStyle,
  Theme as EmojiPickerTheme,
} from 'emoji-picker-react';
import {
  useFloating,
  offset as offsetMiddleware,
  flip as flipMiddleware,
  shift as shiftMiddleware,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  Placement,
} from '@floating-ui/react';

interface EmojiPickerButtonProps {
  children: ReactElement;
  onEmojiSelect: (emojiData: EmojiClickData) => void;
  placement?: Placement;
  offset?: number;
  emojiPickerProps?: {
    emojiStyle?: EmojiStyle;
    theme?: EmojiPickerTheme;
    width?: number | string;
    height?: number | string;
  };
  className?: string;
}

export function EmojiPickerButton({
  children,
  onEmojiSelect,
  placement = 'top-end',
  offset = 8,
  emojiPickerProps = {},
  className,
}: EmojiPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating<HTMLButtonElement>({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offsetMiddleware(offset),
      flipMiddleware({ padding: 8 }),
      shiftMiddleware({ padding: 8 }),
    ],
    placement,
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const handleEmojiClickInternal = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData);
    setIsOpen(false);
  };

  if (!isValidElement(children)) {
    console.error(
      'EmojiPickerButton: La prop "children" debe ser un único elemento React válido (ej. un botón).',
    );
    return <>{children}</>;
  }

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({
          ref: refs.setReference,
          ...(children.props as object),
        }),
      )}

      <FloatingPortal>
        {isOpen && (
          <FloatingFocusManager context={context} modal={true}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={`z-50 ${className || ''}`}
              {...getFloatingProps()}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClickInternal}
                emojiStyle={emojiPickerProps.emojiStyle || EmojiStyle.APPLE}
                theme={emojiPickerProps.theme || EmojiPickerTheme.LIGHT}
                width={emojiPickerProps.width || 320}
                height={emojiPickerProps.height || 400}
                autoFocusSearch={false}
                lazyLoadEmojis={true}
                {...emojiPickerProps}
              />
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </>
  );
}
