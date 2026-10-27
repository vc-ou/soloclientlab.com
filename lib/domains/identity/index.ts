/**
 * identity 域入口（后台登录态与管理员判定）。
 *
 * 当前实现仍委托给 lib/auth.ts（Supabase Auth）。域门面的作用是把调用方
 * 与具体鉴权实现解耦：以后换 JWT / 换供应商，只改这里。
 */
export {
  signInAdmin,
  signOutAdmin,
  isAdminAuthenticated,
  requireAdmin
} from "@/lib/auth";
