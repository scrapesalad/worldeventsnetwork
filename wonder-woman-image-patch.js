(function () {
  const mediaReplacements = new Map([
    ["/assets/Clips/remix-maze.mp4", {
      src: "/public/videos/wonderwoman/wonderwoman.mp4",
      type: "video",
      wonderWoman: true
    }],
    ["/assets/Clips/open.mp4", {
      src: "/public/videos/bangkok/bangkok.mp4",
      type: "video"
    }]
  ]);

  function replaceExperienceMedia(root) {
    root.querySelectorAll("video").forEach((video) => {
      const replacement = mediaReplacements.get(video.getAttribute("src"));
      if (!replacement || replacement.type !== "image") {
        if (replacement?.type === "video") {
          video.src = replacement.src;
          if (replacement.wonderWoman) video.classList.add("tools-strip-media-asset-wonderwoman");
        }
        return;
      }
      const image = document.createElement("img");
      image.className = video.className;
      image.src = replacement.src;
      image.alt = replacement.alt;
      image.width = 2900;
      image.height = 1100;
      video.replaceWith(image);
    });
  }

  replaceExperienceMedia(document);
  new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) replaceExperienceMedia(node);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
})();
