export const buildColumns = (envs) => {
  const environments = envs.sort();

  const colWidth = 60.0 / environments.length;
  const columns = [];
  for (env of environments) {
    const info = env.split(/\|/);
    let icon = "fa-internet-explorer";
    if (info[0] === "chrome") {
      icon = "fa-chrome";
    }
    if (info[0] === "safari") {
      icon = "fa-safari";
    }
    if (info[0] === "ios") {
      icon = "fa-apple";
    }

    const version = info.length > 1 ? info[1] : "";
    const width = info.length > 2 ? info[2] : "";

    let name = version;
    if (width && width.length > 0) {
      if (name.length > 0) {
        name += ':'
      }
      name += `${width}`;
    }

    columns.push({
      icon,
      version,
      width,
      name,
      section: info[0],
      key: env
    });
  }

  let curSection = null;
  const sections = [];
  for (var col of columns) {
    if (col.section !== curSection) {
      sections.push({
        section: col.section,
        icon: col.icon,
        cols: 1
      });
      curSection = col.section;
    } else {
      sections[sections.length - 1].cols += 1;
    }
  }

  return {columns, colWidth, sections};
}
