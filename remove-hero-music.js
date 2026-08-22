(function () {
  function removeMusicPlayers(root) {
    if (!root || typeof root.querySelectorAll !== "function") return;

    root.querySelectorAll(".hero-music-player").forEach(function (player) {
      player.remove();
    });
  }

  removeMusicPlayers(document);

  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.matches(".hero-music-player")) {
          node.remove();
          return;
        }

        removeMusicPlayers(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
