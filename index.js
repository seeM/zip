const END = "__END__";

function arrayZip(root) {
  return [root, null];
}

function node(loc) {
  return loc[0];
}

function isBranch(loc) {
  return Array.isArray(node(loc));
}

function children(loc) {
  if (isBranch(loc)) return node(loc);
  else throw new Error("called children on a leaf node");
}

function makeNode(node, children) {
  return children;
}

function path(loc) {
  return loc[1].pnodes;
}

function lefts(loc) {
  return loc[1].l;
}

function rights(loc) {
  return loc[1].r;
}

function down(loc) {
  if (isBranch(loc)) {
    const [node, path] = loc;
    const cs = children(loc);
    const [c, ...cnext] = cs;
    if (cs)
      return [
        c,
        {
          l: [],
          pnodes: path ? path.pnodes.concat([node]) : [node],
          ppath: path,
          r: cnext,
        },
      ];
  }
  return null;
}

function up(loc) {
  const [node, path] = loc;
  const { l, ppath, pnodes, r, changed } = path || {};
  if (pnodes) {
    const pnode = pnodes[pnodes.length - 1];
    return changed
      ? [
          makeNode(pnode, l.concat([node], r)),
          ppath && { ...ppath, changed: true },
        ]
      : [pnode, ppath];
  }
  return null;
}

function isEnd(loc) {
  return loc[1] === END;
}

function root(loc) {
  if (isEnd(loc)) return node(loc);
  const p = up(loc);
  return p ? root(p) : node(loc);
}

function right(loc) {
  const [node, path] = loc;
  const { l, r: rs } = path || {};
  const [r, ...rnext] = rs || [];
  if (path && rs.length)
    return [r, { ...path, l: l.concat([node]), r: rnext }];
  return null;
}

function rightmost(loc) {
  const [node, path] = loc;
  const { l, r } = path || {};
  if (path && r)
    return [
      r[r.length - 1],
      { ...path, l: l.concat([node], r.slice(0, -1)), r: [] },
    ];
  return null;
}

function left(loc) {
  const [node, path] = loc;
  const { l, r } = path || {};
  if (path && l)
    return [
      l[l.length - 1],
      { ...path, l: l.slice(0, -1), r: [node].concat(r) },
    ];
  return null;
}

function leftmost(loc) {
  const [node, path] = loc;
  const { l, r } = path;
  if (path && l)
    return [l[0], { ...path, l: [], r: l.slice(1).concat([node], r) }];
  return null;
}

function insertLeft(loc, item) {
  const [node, path] = loc;
  const { l } = path || {};
  if (!path) throw new Error("Insert at top");
  return [node, { ...path, l: l.concat([item]), changed: true }];
}

function insertRight(loc, item) {
  const [node, path] = loc;
  const { r } = path || {};
  if (!path) throw new Error("Insert at top");
  return [node, { ...path, r: [item].concat(r), changed: true }];
}

function replace(loc, node) {
  const [, path] = loc;
  return [node, { ...path, changed: true }];
}

function edit(loc, f, ...args) {
  return replace(loc, f(node(loc), args));
}

function insertChild(loc, item) {
  return replace(loc, makeNode(node(loc), [item].concat(children(loc))));
}

function appendChild(loc, item) {
  return replace(loc, makeNode(node(loc), children(loc).concat(item)));
}

function next(loc) {
  if (loc[1] === END) {
    return loc;
  }
  return (
    (isBranch(loc) && down(loc)) ||
    right(loc) ||
    (function recur(p) {
      return up(p) ? right(up(p)) || recur(up(p)) : [node(p), END];
    })(loc)
  );
}

function prev(loc) {
  const lloc = left(loc);
  return lloc
    ? (function recur(loc) {
        const child = isBranch(loc) && down(loc);
        return child ? recur(rightmost(child)) : loc;
      })(lloc)
    : up(loc);
}

function remove(loc) {
  const [, path] = loc;
  const { l, ppath, pnodes, r } = path || {};
  if (!path) {
    throw new Error("Remove at top");
  }
  return l?.length
    ? (function recur(loc) {
        const child = isBranch(loc) && down(loc);
        return child ? recur(rightmost(child)) : loc;
      })([l[l.length - 1], { ...path, l: l.slice(0, -1), changed: true }])
    : [makeNode(pnodes[0], r), ppath && { ...ppath, changed: true }];
}

export {
  arrayZip,
  node,
  isBranch,
  children,
  makeNode,
  path,
  lefts,
  rights,
  down,
  up,
  isEnd,
  root,
  right,
  rightmost,
  left,
  leftmost,
  insertLeft,
  insertRight,
  replace,
  edit,
  insertChild,
  appendChild,
  next,
  prev,
  remove
};
