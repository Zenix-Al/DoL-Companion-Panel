export function collectGroupTails(shellRoot) {
  const tails = new Map();
  for (const row of shellRoot.querySelectorAll('[data-shell-groups]')) {
    const sharedTail = { node: row };
    for (const group of row.dataset.shellGroups.split(/\s+/).filter(Boolean)) {
      tails.set(group, sharedTail);
    }
  }
  return tails;
}

export function placeDescriptorRoot({ root, descriptor, shellRoot, groupTails, fallbackTail }) {
  const tail = groupTails.get(descriptor.location.group);
  if (tail) {
    tail.node.after(root);
    tail.node = root;
    return fallbackTail;
  }
  const footer = shellRoot.querySelector('.cp-layout-footer');
  if (fallbackTail) fallbackTail.after(root);
  else if (footer) footer.before(root);
  else shellRoot.appendChild(root);
  return root;
}
