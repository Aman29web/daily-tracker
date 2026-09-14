import { useLayoutEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "expo-router";
import { Layers, Plus, Copy, Archive, Play, Pause, Palmtree } from "lucide-react-native";
import { usePlans, useCreatePlan, usePlanActions, useCreatePause, usePauses } from "@/features/plans/hooks";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Modal from "@/components/ui/Modal";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ScreenContainer from "@/components/ui/ScreenContainer";
import { todayStr } from "@/utils/date";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Plan } from "@/types";

export default function PlansScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { data: plans, isLoading } = usePlans({ isArchived: false });
  const { data: pauses } = usePauses();
  const { activate, deactivate, archive, duplicate } = usePlanActions();
  const [createOpen, setCreateOpen] = useState(false);
  const [pausingPlanId, setPausingPlanId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setCreateOpen(true)} hitSlop={8}>
          <Plus size={22} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, colors]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Bundles of habits built around a goal or lifestyle.</Text>

        {isLoading ? (
          <>
            <Skeleton height={110} radius={16} />
            <Skeleton height={110} radius={16} />
          </>
        ) : plans?.length === 0 ? (
          <EmptyState icon={Layers} title="No plans yet" description="Bundle related habits into a plan, like Fitness or Deep Work." />
        ) : (
          plans?.map((plan) => {
            const activePause = (pauses ?? []).find((p) => p.planId === plan._id && p.isActive);
            return (
              <PlanCard
                key={plan._id}
                plan={plan}
                activePauseEndDate={activePause?.endDate}
                onToggleActive={() => (plan.isActive ? deactivate.mutate(plan._id) : activate.mutate(plan._id))}
                onPause={() => setPausingPlanId(plan._id)}
                onDuplicate={() => duplicate.mutate(plan._id)}
                onArchive={() => archive.mutate(plan._id)}
              />
            );
          })
        )}
      </ScrollView>

      <Modal visible={createOpen} onClose={() => setCreateOpen(false)} title="New plan">
        <PlanCreateForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal visible={!!pausingPlanId} onClose={() => setPausingPlanId(null)} title="Pause plan (vacation mode)">
        {pausingPlanId ? <PlanPauseForm planId={pausingPlanId} onDone={() => setPausingPlanId(null)} /> : null}
      </Modal>
    </ScreenContainer>
  );
}

function PlanCard({
  plan,
  activePauseEndDate,
  onToggleActive,
  onPause,
  onDuplicate,
  onArchive,
}: {
  plan: Plan;
  activePauseEndDate?: string;
  onToggleActive: () => void;
  onPause: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: plan.color + "22" }]}>
          <DynamicIcon name={plan.icon} size={18} color={plan.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{plan.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{plan.habitCount ?? 0} habits</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: (plan.isActive ? colors.success : colors.textMuted) + "22" }]}>
          <Text style={{ color: plan.isActive ? colors.success : colors.textMuted, fontSize: 10, fontWeight: "700" }}>
            {plan.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {plan.description ? <Text style={{ color: colors.textMuted, fontSize: 13 }}>{plan.description}</Text> : null}

      {activePauseEndDate ? (
        <View style={styles.vacationRow}>
          <Palmtree size={13} color="#60A5FA" />
          <Text style={{ color: "#60A5FA", fontSize: 12 }}>Paused until {activePauseEndDate}</Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <ActionBtn icon={plan.isActive ? <Pause size={13} color={colors.text} /> : <Play size={13} color={colors.text} />} label={plan.isActive ? "Deactivate" : "Activate"} onPress={onToggleActive} colors={colors} />
        <ActionBtn icon={<Palmtree size={13} color={colors.text} />} label="Pause" onPress={onPause} colors={colors} />
        <ActionBtn icon={<Copy size={13} color={colors.text} />} label="Duplicate" onPress={onDuplicate} colors={colors} />
        <ActionBtn icon={<Archive size={13} color={colors.text} />} label="Archive" onPress={onArchive} colors={colors} />
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, onPress, colors }: { icon: React.ReactNode; label: string; onPress: () => void; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  return (
    <Pressable style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]} onPress={onPress}>
      {icon}
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function PlanCreateForm({ onDone }: { onDone: () => void }) {
  const create = useCreatePlan();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <View style={{ gap: 14 }}>
      <TextField label="Name" placeholder="e.g. Fitness Plan" value={name} onChangeText={setName} />
      <TextField label="Description (optional)" value={description} onChangeText={setDescription} multiline />
      <Button
        label={create.isPending ? "Creating…" : "Create plan"}
        loading={create.isPending}
        onPress={() => {
          if (!name.trim()) return;
          create.mutate({ name, description: description || undefined, category: "general" }, { onSuccess: onDone });
        }}
      />
    </View>
  );
}

function PlanPauseForm({ planId, onDone }: { planId: string; onDone: () => void }) {
  const { colors } = useAppTheme();
  const createPause = useCreatePause();
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>
        Every habit in this plan will be marked paused for the range you choose. Streaks are protected and no reminders fire.
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="End date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        </View>
      </View>
      <Button
        label={createPause.isPending ? "Scheduling…" : "Pause plan"}
        loading={createPause.isPending}
        onPress={() => createPause.mutate({ planId, startDate, endDate }, { onSuccess: onDone })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  vacationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
});
