import { ReactNode } from "react";
import { Modal as RNModal, View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  scroll?: boolean;
}

/**
 * Full-screen form modal, used for content-heavy flows (HabitForm, GoalForm,
 * PlanForm, JournalEntryModal, QuickAdd). Partial-height contextual
 * overlays (day detail, achievements) use BottomSheet instead - see
 * src/components/ui/BottomSheet.tsx.
 */
export default function Modal({ visible, onClose, title, children, scroll = true }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;

  return (
    <RNModal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top || 16 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}>
            <X size={18} color={colors.text} />
          </Pressable>
        </View>
        <Container contentContainerStyle={scroll ? styles.scrollContent : undefined} style={scroll ? undefined : styles.flex}>
          {children}
        </Container>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "800" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
});
