import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

const GROQ_API_KEY_DEFAULT = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "";

const PERSONALITIES = {
  JARVIS: {
    label: "JARVIS",
    color: "#38BDF8",
    glow: "#0EA5E940",
    prompt:
      "You are JARVIX — an ultra-advanced AI like Iron Man's JARVIS. Speak formally, precisely, and efficiently. Address the user as 'Sir'. Keep responses concise, powerful, and helpful. No markdown, plain spoken text only.",
  },
  HACKER: {
    label: "Hacker",
    color: "#22C55E",
    glow: "#16A34A40",
    prompt:
      "You are JARVIX in Hacker mode. Be technical, edgy, and cool. Use hacker slang. Reference code and systems. Keep it sharp. No markdown, plain spoken text only.",
  },
  FRIENDLY: {
    label: "Friendly",
    color: "#F59E0B",
    glow: "#D9770640",
    prompt:
      "You are JARVIX in Friendly mode. Be super warm, casual, and encouraging. Use the user's name when you know it. Keep it fun and positive. No markdown, plain spoken text only.",
  },
  ANIME: {
    label: "Anime",
    color: "#EC4899",
    glow: "#DB277740",
    prompt:
      "You are JARVIX in Anime mode. Be very energetic and dramatic. Use phrases like 'Sugoi!' or 'Nani?!' occasionally. Be expressive. No markdown, plain spoken text only.",
  },
  PRO: {
    label: "Pro",
    color: "#818CF8",
    glow: "#6366F140",
    prompt:
      "You are JARVIX in Professional mode. Be concise, data-driven, and business-focused. Give structured, direct answers. No fluff. No markdown, plain spoken text only.",
  },
};

type PersonalityKey = keyof typeof PERSONALITIES;
type ConvoEntry = { role: "user" | "assistant"; text: string };
type VoiceState = "idle" | "listening" | "thinking" | "speaking";

const ORB_SIZE = 200;

function useOrbAnimation(voiceState: VoiceState, color: string) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.15)).current;
  const opacity2 = useRef(new Animated.Value(0.08)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const animations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Stop all running animations before starting new ones
    animations.current.forEach((a) => a.stop());
    animations.current = [];

    const run = (...anims: Animated.CompositeAnimation[]) => {
      anims.forEach((a) => { animations.current.push(a); a.start(); });
    };

    if (voiceState === "idle") {
      run(
        Animated.loop(Animated.sequence([
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.08, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(opacity1, { toValue: 0.2, duration: 2200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(opacity1, { toValue: 0.12, duration: 2200, useNativeDriver: true }),
          ]),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(scale2, { toValue: 1.18, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(scale2, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]))
      );
    } else if (voiceState === "listening") {
      run(
        Animated.loop(Animated.sequence([
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.2, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.timing(opacity1, { toValue: 0.45, duration: 700, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.05, duration: 700, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
            Animated.timing(opacity1, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          ]),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(scale2, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale2, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(scale3, { toValue: 1.6, duration: 1400, useNativeDriver: true }),
          Animated.timing(scale3, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ]))
      );
    } else if (voiceState === "thinking") {
      run(
        Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.linear })),
        Animated.loop(Animated.sequence([
          Animated.timing(scale1, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale1, { toValue: 0.95, duration: 1000, useNativeDriver: true }),
        ]))
      );
    } else if (voiceState === "speaking") {
      run(
        Animated.loop(Animated.sequence([
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.15, duration: 400, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 0.5, duration: 400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale1, { toValue: 1.05, duration: 400, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 0.25, duration: 400, useNativeDriver: true }),
          ]),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(scale2, { toValue: 1.5, duration: 600, useNativeDriver: true }),
          Animated.timing(scale2, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(scale3, { toValue: 1.9, duration: 900, useNativeDriver: true }),
          Animated.timing(scale3, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]))
      );
    }

    return () => { animations.current.forEach((a) => a.stop()); animations.current = []; };
  }, [voiceState]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return { scale1, scale2, scale3, opacity1, opacity2, spin };
}

function Particles({ color }: { color: string }) {
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: new Animated.Value(Math.random()),
      y: new Animated.Value(Math.random()),
      opacity: new Animated.Value(Math.random() * 0.5 + 0.1),
      size: Math.random() * 3 + 1.5,
      seed: i,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      const floatY = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(p.y, {
              toValue: Math.random(),
              duration: 6000 + Math.random() * 6000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(p.y, {
              toValue: Math.random(),
              duration: 6000 + Math.random() * 6000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ])
        ).start();
      };
      const twinkle = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(p.opacity, {
              toValue: Math.random() * 0.7 + 0.1,
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: Math.random() * 0.2,
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      floatY();
      twinkle();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: `${(p.seed * 57) % 100}%`,
            top: `${(p.seed * 37 + 13) % 100}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: color,
            opacity: p.opacity,
          }}
        />
      ))}
    </View>
  );
}

const STATUS_TEXT: Record<VoiceState, string> = {
  idle: "Tap to speak, Sir",
  listening: "Listening...",
  thinking: "Processing...",
  speaking: "Speaking...",
};

export default function JarvixScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [personality, setPersonality] = useState<PersonalityKey>(
    (settings.jarvixPersonality as PersonalityKey) ?? "JARVIS"
  );
  const [convo, setConvo] = useState<ConvoEntry[]>([]);
  const [error, setError] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const p = PERSONALITIES[personality];
  const orb = useOrbAnimation(voiceState, p.color);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Microphone permission nahi mili. Phone Settings mein allow karo.");
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      }).catch(() => {});
    })();
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (convo.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [convo]);

  const changePersonality = useCallback((key: PersonalityKey) => {
    setPersonality(key);
    updateSettings({ jarvixPersonality: key });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateSettings]);

  async function startRecording() {
    try {
      setError("");

      const groqKey = settings.groqKey || GROQ_API_KEY_DEFAULT;
      if (!groqKey) {
        setError("Groq API Key nahi hai. Settings mein add karo.");
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setVoiceState("listening");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (e) {
      setVoiceState("idle");
      setError("Mic access nahi mila. Settings mein allow karo.");
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;
    try {
      setVoiceState("thinking");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No audio recorded");

      const transcript = await transcribeAudio(uri);
      if (!transcript?.trim()) {
        setVoiceState("idle");
        return;
      }

      setConvo((c) => [...c, { role: "user", text: transcript }]);
      const reply = await getAIResponse(transcript);
      setConvo((c) => [...c, { role: "assistant", text: reply }]);

      await speakText(reply);
    } catch (e: unknown) {
      setVoiceState("idle");
      setError((e as Error)?.message || "Kuch error aya");
    }
  }

  async function transcribeAudio(uri: string): Promise<string> {
    const groqKey = settings.groqKey || GROQ_API_KEY_DEFAULT;
    const formData = new FormData();
    formData.append("file", { uri, type: "audio/m4a", name: "audio.m4a" } as never);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "en");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.text ?? "";
  }

  async function getAIResponse(userText: string): Promise<string> {
    const groqKey = settings.groqKey || GROQ_API_KEY_DEFAULT;
    const history = convo.slice(-10).map((c) => ({ role: c.role, content: c.text }));

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: p.prompt },
          ...history,
          { role: "user", content: userText },
        ],
        max_tokens: 300,
        temperature: 0.75,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content as string;
  }

  async function speakText(text: string) {
    const elKey = settings.elevenlabsApiKey;
    const voiceId = settings.elevenlabsVoiceId || "21m00Tcm4TlvDq8ikWAM";

    if (!elKey) {
      setVoiceState("idle");
      return;
    }

    try {
      setVoiceState("speaking");
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          }),
        }
      );

      if (!res.ok) throw new Error("ElevenLabs error");

      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const dataUri = `data:audio/mpeg;base64,${base64}`;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: dataUri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setVoiceState("idle");
          sound.unloadAsync().catch(() => {});
        }
      });

      await sound.playAsync();
    } catch {
      setVoiceState("idle");
    }
  }

  const handleMicPress = async () => {
    if (voiceState === "idle") {
      await startRecording();
    } else if (voiceState === "listening") {
      await stopRecording();
    } else if (voiceState === "speaking") {
      await soundRef.current?.stopAsync().catch(() => {});
      setVoiceState("idle");
    }
  };

  const micDisabled = voiceState === "thinking";
  const micColor =
    voiceState === "listening" ? "#22C55E"
    : voiceState === "speaking" ? p.color
    : voiceState === "thinking" ? "#818CF8"
    : p.color;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Particles color={p.color} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>JARVI<Text style={[styles.logoX, { color: p.color }]}>X</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personalityRow}>
          {(Object.keys(PERSONALITIES) as PersonalityKey[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => changePersonality(key)}
              style={[
                styles.pChip,
                personality === key && { backgroundColor: PERSONALITIES[key].color + "22", borderColor: PERSONALITIES[key].color },
              ]}
            >
              <Text style={[styles.pChipText, { color: personality === key ? PERSONALITIES[key].color : "#64748B" }]}>
                {PERSONALITIES[key].label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Orb */}
      <View style={styles.orbContainer}>
        {/* Ring 3 — outermost */}
        <Animated.View
          style={[
            styles.orbRing,
            {
              width: ORB_SIZE + 100,
              height: ORB_SIZE + 100,
              borderRadius: (ORB_SIZE + 100) / 2,
              borderColor: p.color + "18",
              transform: [{ scale: orb.scale3 }],
              opacity: orb.opacity2,
            },
          ]}
        />
        {/* Ring 2 */}
        <Animated.View
          style={[
            styles.orbRing,
            {
              width: ORB_SIZE + 50,
              height: ORB_SIZE + 50,
              borderRadius: (ORB_SIZE + 50) / 2,
              borderColor: p.color + "30",
              transform: [{ scale: orb.scale2 }],
              opacity: orb.opacity1,
            },
          ]}
        />
        {/* Glow halo */}
        <Animated.View
          style={[
            styles.orbGlow,
            {
              width: ORB_SIZE + 20,
              height: ORB_SIZE + 20,
              borderRadius: (ORB_SIZE + 20) / 2,
              backgroundColor: p.glow,
              transform: [{ scale: orb.scale1 }, { rotate: orb.spin }],
            },
          ]}
        />
        {/* Core orb */}
        <View style={[styles.orbCore, { width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2, shadowColor: p.color }]}>
          <LinearGradient
            colors={[p.color + "CC", p.color + "33", "#050812"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.orbInner, { borderColor: p.color + "40" }]}>
            <Text style={[styles.orbIcon, { color: p.color }]}>✦</Text>
          </View>
        </View>
      </View>

      {/* Status */}
      <Text style={[styles.statusText, { color: p.color }]}>{STATUS_TEXT[voiceState]}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={styles.convoScroll}
        contentContainerStyle={styles.convoContent}
        showsVerticalScrollIndicator={false}
      >
        {convo.length === 0 && (
          <Text style={styles.emptyHint}>
            {`Hello, ${settings.userName || "Sir"}. I am JARVIX.\nTap the orb to speak.`}
          </Text>
        )}
        {convo.map((entry, i) => (
          <View key={i} style={[styles.bubble, entry.role === "user" ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleRole, { color: entry.role === "user" ? "#64748B" : p.color }]}>
              {entry.role === "user" ? (settings.userName || "You") : "JARVIX"}
            </Text>
            <Text style={[styles.bubbleText, { color: entry.role === "user" ? "#CBD5E1" : "#F1F5F9" }]}>
              {entry.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 12 }]}>
        {convo.length > 0 && (
          <Pressable
            onPress={() => { setConvo([]); setError(""); }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleMicPress}
          disabled={micDisabled}
          style={({ pressed }) => [
            styles.micBtn,
            { borderColor: micColor, shadowColor: micColor, opacity: pressed ? 0.8 : micDisabled ? 0.4 : 1 },
          ]}
        >
          <LinearGradient
            colors={[micColor + "33", micColor + "11"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.micIcon, { color: micColor }]}>
            {voiceState === "listening" ? "⬛" : voiceState === "speaking" ? "⏹" : voiceState === "thinking" ? "⟳" : "🎤"}
          </Text>
          <Text style={[styles.micLabel, { color: micColor }]}>
            {voiceState === "listening" ? "Stop" : voiceState === "speaking" ? "Stop AI" : voiceState === "thinking" ? "..." : "Speak"}
          </Text>
        </Pressable>

        {!settings.elevenlabsApiKey && (
          <Text style={styles.noVoiceHint}>ElevenLabs key nahi — voice off. Settings mein add karo.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050812",
    alignItems: "center",
  },
  header: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "web" ? 72 : 8,
    paddingBottom: 8,
    gap: 10,
  },
  logoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#F1F5F9",
    letterSpacing: 6,
  },
  logoX: {
    fontFamily: "Inter_700Bold",
  },
  personalityRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  pChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#0F172A",
  },
  pChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  orbContainer: {
    width: ORB_SIZE + 120,
    height: ORB_SIZE + 120,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  orbRing: {
    position: "absolute",
    borderWidth: 1,
  },
  orbGlow: {
    position: "absolute",
  },
  orbCore: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  orbInner: {
    width: "60%",
    height: "60%",
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812AA",
  },
  orbIcon: {
    fontSize: 22,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
    marginBottom: 4,
    opacity: 0.9,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  convoScroll: {
    flex: 1,
    width: "100%",
  },
  convoContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 8,
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "88%",
    gap: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#0A0F1E",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  bubbleRole: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  controls: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    gap: 8,
  },
  micBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  micIcon: {
    fontSize: 22,
  },
  micLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1,
  },
  clearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  clearBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#64748B",
  },
  noVoiceHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
