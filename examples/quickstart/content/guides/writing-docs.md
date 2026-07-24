---
title: Writing docs
description: How pages and navigation are derived.
---

# Writing docs

Each markdown file under `content/` maps 1:1 to a URL. Folders become
navigation sections. Frontmatter `title` and `description` drive the page
header and the search index.

```md
---
title: My page
---

# My page

Content goes here.
```
