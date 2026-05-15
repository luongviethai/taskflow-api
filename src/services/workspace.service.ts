/**
 * src/services/workspace.service.ts
 *
 * Business logic cho Workspace + Project.
 * KHÔNG biết HTTP (không có req, res).
 * Nhận data thuần → xử lý → return data hoặc throw AppError.
 */

import { Knex } from "knex";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../errors/app-errors";

// ── Types ─────────────────────────────────────────────

interface CreateWorkspaceInput {
  name: string;
}

interface AddMemberInput {
  user_id: number;
  role: "member" | "viewer";
}

interface CreateProjectInput {
  name: string;
  description?: string;
}

// ── Service ───────────────────────────────────────────

export class WorkspaceService {
  constructor(private db: Knex) {}

  /**
   * Kiểm tra user là member của workspace.
   * Dùng ở nhiều chỗ → tách thành method riêng.
   *
   * Trả 404 (không phải 403) nếu không phải member:
   * → không lộ thông tin workspace tồn tại cho người ngoài.
   */
  async verifyMembership(workspaceId: number, userId: number) {
    const membership = await this.db("workspace_members")
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();

    if (!membership) {
      throw new NotFoundError("Workspace");
    }

    return membership;
  }

  /**
   * Kiểm tra workspace tồn tại. Dùng cho internal check
   * (khi đã biết user có quyền, chỉ cần check existence).
   */
  private async findWorkspaceOrFail(workspaceId: number) {
    const workspace = await this.db("workspaces")
      .where({ id: workspaceId })
      .first();

    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    return workspace;
  }

  // ── CREATE WORKSPACE ────────────────────────────────

  async createWorkspace(userId: number, input: CreateWorkspaceInput) {
    // Transaction: tạo workspace + thêm owner phải cùng thành công
    const workspace = await this.db.transaction(async (trx) => {
      const [newWorkspace] = await trx("workspaces")
        .insert({
          name: input.name,
          owner_id: userId,
          created_at: new Date(),
        })
        .returning("*");

      await trx("workspace_members").insert({
        workspace_id: newWorkspace.id,
        user_id: userId,
        role: "owner",
      });

      return newWorkspace;
    });

    return workspace;
  }

  // ── LIST WORKSPACES ─────────────────────────────────

  async listWorkspaces(userId: number) {
    const workspaces = await this.db("workspaces")
      .join(
        "workspace_members",
        "workspaces.id",
        "workspace_members.workspace_id",
      )
      .where("workspace_members.user_id", userId)
      .select("workspaces.*", "workspace_members.role as my_role");

    return workspaces;
  }

  // ── GET WORKSPACE BY ID ─────────────────────────────

  async getWorkspace(workspaceId: number, userId: number) {
    const membership = await this.verifyMembership(workspaceId, userId);

    const workspace = await this.db("workspaces")
      .where({ id: workspaceId })
      .first();

    return { ...workspace, my_role: membership.role };
  }

  // ── ADD MEMBER ──────────────────────────────────────

  async addMember(
    workspaceId: number,
    currentUserId: number,
    input: AddMemberInput,
  ) {
    // Check 1: Workspace tồn tại?
    await this.findWorkspaceOrFail(workspaceId);

    // Check 2: User hiện tại là owner?
    const currentMember = await this.db("workspace_members")
      .where({ workspace_id: workspaceId, user_id: currentUserId })
      .first();

    if (!currentMember || currentMember.role !== "owner") {
      throw new ForbiddenError("Only workspace owner can add members");
    }

    // Check 3: User được thêm có tồn tại?
    const targetUser = await this.db("users")
      .where({ id: input.user_id })
      .first();

    if (!targetUser) {
      throw new NotFoundError("User");
    }

    // Check 4: Đã là member?
    const existingMember = await this.db("workspace_members")
      .where({ workspace_id: workspaceId, user_id: input.user_id })
      .first();

    if (existingMember) {
      throw new ConflictError("User is already a member of this workspace");
    }

    // Insert member
    await this.db("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: input.user_id,
      role: input.role,
    });

    return {
      workspace_id: workspaceId,
      user_id: input.user_id,
      role: input.role,
    };
  }

  // ── CREATE PROJECT ──────────────────────────────────

  async createProject(
    workspaceId: number,
    userId: number,
    input: CreateProjectInput,
  ) {
    // Check membership — bất kỳ role nào đều được tạo project
    await this.verifyMembership(workspaceId, userId);

    const [project] = await this.db("projects")
      .insert({
        workspace_id: workspaceId,
        name: input.name,
        description: input.description || "",
        created_at: new Date(),
      })
      .returning("*");

    return project;
  }

  // ── LIST PROJECTS ───────────────────────────────────

  async listProjects(workspaceId: number, userId: number) {
    // Check membership
    await this.verifyMembership(workspaceId, userId);

    const projects = await this.db("projects")
      .where({ workspace_id: workspaceId })
      .orderBy("created_at", "desc");

    return projects;
  }
}
