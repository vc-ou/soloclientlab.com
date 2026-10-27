/**
 * analytics 域入口（事件与聚合）。
 * 注意：其他域只应引用 ./emit（例外 E-001），不要引用聚合。
 */
export * from "./emit";
export * from "./service";
export * from "./aggregates";
