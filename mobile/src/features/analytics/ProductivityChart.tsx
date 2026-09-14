import { View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ProductivityChart({ data }: { data: { date: string; score: number }[] }) {
  const { colors } = useAppTheme();

  const points = data.map((d) => ({ value: d.score, label: d.date }));

  return (
    <View style={{ marginLeft: -8 }}>
      <LineChart
        data={points}
        areaChart
        curved
        color={colors.primary}
        thickness={2.5}
        startFillColor={colors.primary}
        endFillColor={colors.primary}
        startOpacity={0.35}
        endOpacity={0}
        dataPointsColor={colors.primary}
        dataPointsRadius={3}
        hideRules
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
        noOfSections={4}
        maxValue={100}
        height={200}
        spacing={points.length > 1 ? undefined : 40}
        initialSpacing={16}
        adjustToWidth
      />
    </View>
  );
}
