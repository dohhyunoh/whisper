import { RiveFileFactory, RiveView, useRive, useViewModelInstance } from '@rive-app/react-native';
import React, { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type RiveFile = Awaited<ReturnType<typeof RiveFileFactory.fromSource>>;

export type ArgoEmotion = 'clear' | 'sad' | 'angry' | 'anxiety';

interface ArgoEmotionViewProps {
  emotion: ArgoEmotion;
  style?: StyleProp<ViewStyle>;
}

// Single-file Argo mascot (argo_4em). Emotion switching is driven by data-binding
// triggers (clear/sad/angry/anxiety) on the file's view model, not by separate
// files or state machine inputs.
export function ArgoEmotionView({ emotion, style }: ArgoEmotionViewProps) {
  const [riveFile, setRiveFile] = useState<RiveFile | null>(null);
  const { riveViewRef, setHybridRef } = useRive();
  const viewModelInstance = useViewModelInstance(riveViewRef);

  useEffect(() => {
    let cancelled = false;
    RiveFileFactory.fromSource(require('@/assets/rive/argo_4em_v1.1.riv'), undefined)
      .then((f) => {
        if (!cancelled) setRiveFile(f);
      })
      .catch((err) => console.warn('Failed to load Argo emotions Rive file:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Fire the emotion trigger only once the native view is ready — triggering
  // earlier is a no-op and would leave the mascot on its default (clear) state.
  useEffect(() => {
    if (!riveViewRef || !viewModelInstance) return;
    let cancelled = false;
    riveViewRef.awaitViewReady().then(() => {
      if (cancelled) return;
      viewModelInstance.triggerProperty(emotion)?.trigger();
      riveViewRef.playIfNeeded();
    });
    return () => {
      cancelled = true;
    };
  }, [riveViewRef, viewModelInstance, emotion]);

  if (!riveFile) return null;

  return (
    <RiveView
      hybridRef={setHybridRef}
      file={riveFile}
      artboardName="main"
      stateMachineName="main"
      autoPlay
      style={style}
    />
  );
}
