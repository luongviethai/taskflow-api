export const getParamsId = (ids: string | string[]) => {
  let id: string;
  if (typeof ids === "string") {
    id = ids;
  } else {
    id = ids[0];
  }
  return id;
};
