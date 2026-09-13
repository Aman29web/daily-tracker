import { Plan, IPlan } from "../models/Plan";
import { Habit } from "../models/Habit";
import { ApiError } from "../utils/ApiError";

export async function getOwnedPlan(userId: string, planId: string): Promise<IPlan> {
  const plan = await Plan.findOne({ _id: planId, userId });
  if (!plan) throw ApiError.notFound("Plan not found", "PLAN_NOT_FOUND");
  return plan;
}

export async function listPlans(
  userId: string,
  filters: { isArchived?: boolean; isTemplate?: boolean },
  page: number,
  limit: number
) {
  const query: Record<string, unknown> = { userId, isArchived: filters.isArchived ?? false };
  if (filters.isTemplate !== undefined) query.isTemplate = filters.isTemplate;

  const [items, total] = await Promise.all([
    Plan.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Plan.countDocuments(query),
  ]);

  const habitCounts = await Habit.aggregate([
    { $match: { planId: { $in: items.map((p) => p._id) } } },
    { $group: { _id: "$planId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(habitCounts.map((c) => [c._id.toString(), c.count]));

  return {
    items: items.map((p) => ({ ...p.toObject(), habitCount: countMap.get(p._id.toString()) ?? 0 })),
    total,
  };
}

export async function createPlan(userId: string, input: Record<string, unknown>): Promise<IPlan> {
  return Plan.create({ ...input, userId });
}

export async function updatePlan(userId: string, planId: string, updates: Record<string, unknown>): Promise<IPlan> {
  const plan = await getOwnedPlan(userId, planId);
  Object.assign(plan, updates);
  await plan.save();
  return plan;
}

export async function setPlanActive(userId: string, planId: string, isActive: boolean): Promise<IPlan> {
  const plan = await getOwnedPlan(userId, planId);
  plan.isActive = isActive;
  await plan.save();
  return plan;
}

export async function archivePlan(userId: string, planId: string, archived: boolean): Promise<IPlan> {
  const plan = await getOwnedPlan(userId, planId);
  plan.isArchived = archived;
  await plan.save();
  return plan;
}

export async function duplicatePlan(userId: string, planId: string, asTemplate = false): Promise<IPlan> {
  const source = await getOwnedPlan(userId, planId);
  const habits = await Habit.find({ planId: source._id, userId });

  const clone = await Plan.create({
    userId,
    name: asTemplate ? source.name : `${source.name} (copy)`,
    description: source.description,
    category: source.category,
    icon: source.icon,
    color: source.color,
    isActive: true,
    isArchived: false,
    isTemplate: asTemplate,
    sourceTemplateId: source.isTemplate ? source._id : source.sourceTemplateId ?? null,
  });

  if (habits.length) {
    await Habit.insertMany(
      habits.map((h) => ({
        userId,
        name: h.name,
        description: h.description,
        icon: h.icon,
        color: h.color,
        category: h.category,
        type: h.type,
        target: h.target,
        priority: h.priority,
        reminderTime: h.reminderTime,
        startDate: h.startDate,
        endDate: null,
        isActive: true,
        planId: clone._id,
        scheduleHistory: h.scheduleHistory.length
          ? [{ schedule: h.scheduleHistory[h.scheduleHistory.length - 1].schedule, effectiveFrom: h.startDate, effectiveTo: null }]
          : [],
      }))
    );
  }

  return clone;
}

/** Instantiate a personal, fully-editable plan from a template - never forces the user to keep using it as-is. */
export async function useTemplate(userId: string, templateId: string): Promise<IPlan> {
  const template = await Plan.findOne({ _id: templateId, isTemplate: true });
  if (!template) throw ApiError.notFound("Template not found", "TEMPLATE_NOT_FOUND");

  const habits = await Habit.find({ planId: template._id });
  const plan = await Plan.create({
    userId,
    name: template.name,
    description: template.description,
    category: template.category,
    icon: template.icon,
    color: template.color,
    isActive: true,
    isArchived: false,
    isTemplate: false,
    sourceTemplateId: template._id,
  });

  const today = new Date().toISOString().slice(0, 10);
  if (habits.length) {
    await Habit.insertMany(
      habits.map((h) => ({
        userId,
        name: h.name,
        description: h.description,
        icon: h.icon,
        color: h.color,
        category: h.category,
        type: h.type,
        target: h.target,
        priority: h.priority,
        reminderTime: h.reminderTime,
        startDate: today,
        endDate: null,
        isActive: true,
        planId: plan._id,
        scheduleHistory: h.scheduleHistory.length
          ? [{ schedule: h.scheduleHistory[h.scheduleHistory.length - 1].schedule, effectiveFrom: today, effectiveTo: null }]
          : [],
      }))
    );
  }

  return plan;
}
