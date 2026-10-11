(() => {
  const init = () => {
    const all = (selector, root = document) => [...root.querySelectorAll(selector)];
    const params = new URLSearchParams(location.search);
    if (params.get('frame') === 'mobile') document.body.classList.add('mockup-frame');
    all('[data-repeat]').forEach(el => {
      const count = Number(el.dataset.repeat);
      el.removeAttribute('data-repeat');
      if (!Number.isInteger(count) || count < 0) return;
      const template = el.cloneNode(true);
      for (let i = 1; i <= count; i++) {
        const item = i === 1 ? el : template.cloneNode(true);
        const marks = all('[data-repeat-index]', item);
        if (item.hasAttribute('data-repeat-index')) marks.unshift(item);
        marks.forEach(mark => { mark.textContent = String(i); });
        if (i > 1) el.parentNode.insertBefore(item, el.nextSibling);
        el = item;
      }
      if (count === 0) el.remove();
    });
    const groups = ['state', 'variant'].map(key => {
      const nodes = all(`[data-${key}]`);
      const values = [...new Set(nodes.map(node => node.dataset[key]))];
      return { key, nodes, values, current: params.get(key) ?? (key === 'state' ? 'default' : values[0]) };
    }).filter(group => group.values.length);
    const render = () => groups.forEach(group => {
      group.nodes.forEach(node => { node.hidden = node.dataset[group.key] !== group.current; });
      group.label.textContent = `${group.key === 'state' ? '状态' : '方案'}：${group.current}`;
    });
    const move = (group, delta) => {
      group.current = group.values[(group.values.indexOf(group.current) + delta + group.values.length) % group.values.length];
      const url = new URL(location.href);
      url.searchParams.set(group.key, group.current);
      history.replaceState(null, '', url);
      render();
    };
    if (groups.length) {
      const bar = document.createElement('nav');
      bar.className = 'switcher';
      bar.setAttribute('aria-label', '设计稿切换');
      const title = document.createElement('button');
      title.type = 'button';
      title.textContent = '设计稿';
      bar.append(title);
      groups.forEach(group => {
        const controls = document.createElement('span');
        controls.className = 'switcher-group';
        group.label = document.createElement('span');
        group.label.setAttribute('aria-live', 'polite');
        [-1, 1].forEach(delta => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = delta < 0 ? '←' : '→';
          button.setAttribute('aria-label', `${delta < 0 ? '上一个' : '下一个'}${group.key === 'state' ? '状态' : '方案'}`);
          button.addEventListener('click', () => move(group, delta));
          controls.append(button);
          if (delta < 0) controls.append(group.label);
        });
        bar.append(controls);
      });
      const collapse = folded => {
        all('.switcher-group', bar).forEach(group => { group.hidden = folded; });
        title.setAttribute('aria-expanded', String(!folded));
      };
      title.addEventListener('click', () => {
        const folded = title.getAttribute('aria-expanded') === 'true'; collapse(folded);
        const url = new URL(location.href);
        if (folded) url.searchParams.set('bar', '0'); else url.searchParams.delete('bar');
        history.replaceState(null, '', url); reserve();
      });
      collapse(params.get('bar') === '0');
      document.body.append(bar);
      document.body.classList.add('has-switcher');
      render();
      const reserve = () => document.body.style.setProperty('--switcher-height', `${bar.getBoundingClientRect().height}px`);
      reserve();
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(reserve).observe(bar);
    }
    all('[data-tabs]').forEach((container, index) => {
      const own = selector => all(selector, container).filter(el => el.closest('[data-tabs]') === container);
      const tabs = own('[data-tab]'), panels = own('[data-panel]');
      const select = active => {
        tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === active)); tab.tabIndex = i === active ? 0 : -1; });
        panels.forEach((panel, i) => { panel.hidden = i !== active; });
      };
      tabs[0]?.parentElement.setAttribute('role', 'tablist');
      tabs.forEach((tab, i) => {
        tab.id ||= `mockup-tab-${index}-${i}`;
        tab.setAttribute('role', 'tab');
        if (panels[i]) {
          panels[i].id ||= `mockup-panel-${index}-${i}`;
          tab.setAttribute('aria-controls', panels[i].id);
          panels[i].setAttribute('role', 'tabpanel');
          panels[i].setAttribute('aria-labelledby', tab.id);
        }
        tab.addEventListener('click', () => select(i));
        tab.addEventListener('keydown', event => {
          if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          select(next); tabs[next].focus();
        });
      });
      select(0);
    });
    const opened = new Map();
    const close = target => {
      target.hidden = true;
      const trigger = opened.get(target);
      trigger?.setAttribute('aria-expanded', 'false');
      opened.delete(target); trigger?.focus();
    };
    document.addEventListener('click', event => {
      const closer = event.target.closest('[data-close]');
      if (closer) {
        const target = [...opened.keys()].reverse().find(el => el.contains(closer));
        if (target) close(target);
      }
      const trigger = event.target.closest('[data-toggle]');
      if (!trigger) return;
      let target;
      try { target = document.querySelector(trigger.dataset.toggle); } catch { return; }
      if (!target) return;
      if (!target.hidden) { close(target); return; }
      target.hidden = false; opened.set(target, trigger);
      trigger.setAttribute('aria-expanded', 'true');
      const focus = target.querySelector('button, input, select, textarea, a[href], [tabindex]');
      focus?.focus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { [...opened.keys()].reverse().forEach(close); return; }
      const target = [...opened.keys()].reverse().find(el => el.getAttribute('role') === 'dialog');
      if (event.key === 'Tab' && target) {
        const controls = all('button, input, select, textarea, a[href], [tabindex]', target).filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (first && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault(); (event.shiftKey ? last : first).focus();
        }
      }
      if (event.target.closest('input, textarea, select') || event.target.isContentEditable) return;
      const variant = groups.find(group => group.key === 'variant');
      if (variant && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); move(variant, event.key === 'ArrowRight' ? 1 : -1);
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
