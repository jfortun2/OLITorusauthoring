export type PageType = "basic" | "simple" | "advanced"
export type ScoringType = "scored" | "practice"
export type CurriculumView = "default" | "detailed" | "learning"

export type PageNode = {
  id: string
  type: "page"
  title: string
  pageType: PageType
  scoringType: ScoringType
  body: string
  importedFrom?: string
  thumbnail?: string
  intro?: string
  video?: string
  videoName?: string
}

export type ModuleNode = {
  id: string
  type: "module"
  title: string
  expanded: boolean
  pages: PageNode[]
  thumbnail?: string
  intro?: string
  video?: string
  videoName?: string
}

export type UnitNode = {
  id: string
  type: "unit"
  title: string
  expanded: boolean
  items: Array<ModuleNode | PageNode>
  thumbnail?: string
  intro?: string
  video?: string
  videoName?: string
}

export type OutlineNode = UnitNode | PageNode
export type CurriculumNode = OutlineNode | ModuleNode

export type DragKind = "unit" | "module" | "page"
export type DropPlace = "before" | "after" | "inside"

const cover = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="294" height="170" viewBox="0 0 294 170"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="294" height="170" fill="url(#g)"/><circle cx="230" cy="36" r="46" fill="#fff" fill-opacity=".28"/><circle cx="64" cy="128" r="34" fill="#fff" fill-opacity=".18"/></svg>`,
  )}`

export const DEFAULT_THUMBNAIL = cover("#1b3a5f", "#4f7ea8")

const page = (
  id: string,
  title: string,
  pageType: PageType = "basic",
  scoringType: ScoringType = "scored",
  thumbnail?: string,
): PageNode => ({
  id,
  type: "page",
  title,
  pageType,
  scoringType,
  body: "",
  thumbnail,
})

const module = (id: string, title: string, pages: PageNode[], thumbnail?: string): ModuleNode => ({
  id,
  type: "module",
  title,
  expanded: false,
  pages,
  thumbnail,
})

const unit = (id: string, title: string, items: UnitNode["items"], thumbnail?: string): UnitNode => ({
  id,
  type: "unit",
  title,
  expanded: false,
  items,
  thumbnail,
})

export const initialOutline: OutlineNode[] = [
  page("p0", "What learners do with an LTI tool", "basic", "practice", cover("#123a5f", "#3d8bfd")),
  unit("u1", "How a tool launch works", [
    module("m1", "The launch request", [
      page("p1", "Who starts the launch"),
      page("p2", "What the platform sends"),
    ], cover("#0e4d6e", "#7fd3e8")),
  ], cover("#1f6b4a", "#8fd18a")),
  unit("u2", "People, roles, and privacy", [
    module("m4", "Names and roles", [
      page("p37", "Recognizing the learner"),
      page("p38", "Instructor and learner roles"),
      page("p39", "When the roster changes"),
    ], cover("#6b3fa0", "#e39adf")),
    module("m5", "What a tool is allowed to see", [
      page("p40", "Choosing what to share"),
      page("p41", "Launching without a name"),
      page("p42", "Asking before sharing more"),
    ]),
  ], cover("#5a2a6a", "#f0a3c8")),
  unit("u3", "Scores coming back", [
    module("m6", "The grade column", [
      page("p43", "Creating a place for the score"),
      page("p44", "Returning a result"),
    ]),
  ], cover("#8a4b12", "#f0b27a")),
  unit("u4", "Adding a tool to the course", [
    module("m7", "Placing the link", [
      page("p45", "Where learners find the tool"),
      page("p46", "Trying the launch"),
    ]),
  ]),
]

export const uid = () => Math.random().toString(36).slice(2, 9)

export function isUnit(node: CurriculumNode): node is UnitNode {
  return node.type === "unit"
}

export function isModule(node: CurriculumNode): node is ModuleNode {
  return node.type === "module"
}

export function isPage(node: CurriculumNode): node is PageNode {
  return node.type === "page"
}

export type PageLocation = {
  page: PageNode
  unit?: UnitNode
  module?: ModuleNode
}

export function findPage(outline: OutlineNode[], id: string): PageLocation | null {
  for (const node of outline) {
    if (node.type === "page" && node.id === id) return { page: node }
    if (node.type !== "unit") continue
    for (const item of node.items) {
      if (item.type === "page" && item.id === id) return { page: item, unit: node }
      if (item.type === "module") {
        const page = item.pages.find((entry) => entry.id === id)
        if (page) return { page, unit: node, module: item }
      }
    }
  }
  return null
}

export type FlatPage = PageLocation & { trail: string }

export function flattenPages(outline: OutlineNode[]): FlatPage[] {
  const pages: FlatPage[] = []
  for (const node of outline) {
    if (node.type === "page") {
      pages.push({ page: node, trail: "Top level" })
      continue
    }
    for (const item of node.items) {
      if (item.type === "page") {
        pages.push({ page: item, unit: node, trail: node.title })
      } else {
        for (const page of item.pages) {
          pages.push({
            page,
            unit: node,
            module: item,
            trail: `${node.title} / ${item.title}`,
          })
        }
      }
    }
  }
  return pages
}

export function findTitle(outline: OutlineNode[], id: string): string | null {
  const located = locate(outline, id)
  return located?.node.title ?? null
}

export type ThumbnailKind = "unit" | "module" | "page"

export type ThumbnailTarget = {
  id: string
  kind: ThumbnailKind
  title: string
  pageCount: number | null
  thumbnail?: string
  intro?: string
  video?: string
  videoName?: string
}

export type LearnerCardUpdate = {
  thumbnail?: string
  intro?: string
  video?: string
  videoName?: string
}

function countUnitPages(unit: UnitNode) {
  return unit.items.reduce((sum, item) => sum + (item.type === "page" ? 1 : item.pages.length), 0)
}

export function thumbnailTarget(outline: OutlineNode[], id: string): ThumbnailTarget | null {
  for (const node of outline) {
    if (node.id === id && node.type === "page") {
      return {
        id,
        kind: "page",
        title: node.title,
        pageCount: null,
        thumbnail: node.thumbnail,
        intro: node.intro,
        video: node.video,
        videoName: node.videoName,
      }
    }
    if (node.id === id && node.type === "unit") {
      return {
        id,
        kind: "unit",
        title: node.title,
        pageCount: countUnitPages(node),
        thumbnail: node.thumbnail,
        intro: node.intro,
        video: node.video,
        videoName: node.videoName,
      }
    }
    if (node.type !== "unit") continue
    for (const item of node.items) {
      if (item.id === id && item.type === "module") {
        return {
          id,
          kind: "module",
          title: item.title,
          pageCount: item.pages.length,
          thumbnail: item.thumbnail,
          intro: item.intro,
          video: item.video,
          videoName: item.videoName,
        }
      }
    }
  }
  return null
}

function withCard<T extends LearnerCardUpdate>(node: T, card: LearnerCardUpdate): T {
  const next = { ...node }
  const fields: (keyof LearnerCardUpdate)[] = ["thumbnail", "intro", "video", "videoName"]
  for (const key of fields) {
    const value = card[key]?.trim()
    if (value) next[key] = value
    else delete next[key]
  }
  return next
}

export function setLearnerCard(outline: OutlineNode[], id: string, card: LearnerCardUpdate): OutlineNode[] {
  return outline.map((node) => {
    if (node.id === id && (node.type === "page" || node.type === "unit")) return withCard(node, card)
    if (node.type !== "unit") return node
    return {
      ...node,
      items: node.items.map((item) => (item.type === "module" && item.id === id ? withCard(item, card) : item)),
    }
  })
}

type Located = {
  node: CurriculumNode
  parentList: CurriculumNode[]
  index: number
}

function locate(outline: OutlineNode[], id: string): Located | null {
  const walkList = (list: CurriculumNode[]): Located | null => {
    for (let index = 0; index < list.length; index += 1) {
      const node = list[index]
      if (node.id === id) return { node, parentList: list, index }
      if (node.type === "unit") {
        const nested = walkList(node.items)
        if (nested) return nested
      } else if (node.type === "module") {
        const nested = walkList(node.pages)
        if (nested) return nested
      }
    }
    return null
  }
  return walkList(outline)
}

function contains(node: CurriculumNode, id: string): boolean {
  if (node.id === id) return true
  if (node.type === "unit") return node.items.some((item) => contains(item, id))
  if (node.type === "module") return node.pages.some((item) => contains(item, id))
  return false
}

export function applyView(outline: OutlineNode[], view: CurriculumView): OutlineNode[] {
  return outline.map((node) => {
    if (node.type !== "unit") return node
    return {
      ...node,
      expanded: view !== "default",
      items: node.items.map((item) =>
        item.type === "module" ? { ...item, expanded: view === "detailed" } : item,
      ),
    }
  })
}

export function setExpanded(outline: OutlineNode[], expanded: boolean): OutlineNode[] {
  return outline.map((node) => {
    if (node.type !== "unit") return node
    return {
      ...node,
      expanded,
      items: node.items.map((item) =>
        item.type === "module" ? { ...item, expanded } : item,
      ),
    }
  })
}

export function isFullyExpanded(outline: OutlineNode[]): boolean {
  return outline.every(
    (node) =>
      node.type !== "unit" ||
      (node.expanded && node.items.every((item) => item.type !== "module" || item.expanded)),
  )
}

export function anyExpanded(outline: OutlineNode[]): boolean {
  return outline.some(
    (node) =>
      node.type === "unit" &&
      (node.expanded || node.items.some((item) => item.type === "module" && item.expanded)),
  )
}

export function toggleUnit(outline: OutlineNode[], unitId: string): OutlineNode[] {
  return outline.map((node) =>
    node.type === "unit" && node.id === unitId ? { ...node, expanded: !node.expanded } : node,
  )
}

export function toggleModule(
  outline: OutlineNode[],
  unitId: string,
  moduleId: string,
): OutlineNode[] {
  return outline.map((node) => {
    if (node.type !== "unit" || node.id !== unitId) return node
    return {
      ...node,
      items: node.items.map((item) =>
        item.type === "module" && item.id === moduleId
          ? { ...item, expanded: !item.expanded }
          : item,
      ),
    }
  })
}

export function addUnit(outline: OutlineNode[], title: string): OutlineNode[] {
  return [
    ...outline,
    { id: uid(), type: "unit", title, expanded: false, items: [] },
  ]
}

export function addModule(outline: OutlineNode[], unitId: string, title: string): OutlineNode[] {
  return outline.map((node) => {
    if (node.type !== "unit" || node.id !== unitId) return node
    return {
      ...node,
      expanded: true,
      items: [
        ...node.items,
        { id: uid(), type: "module", title, expanded: false, pages: [] },
      ],
    }
  })
}

export function addPage(
  outline: OutlineNode[],
  title: string,
  pageType: PageType,
  scoringType: ScoringType,
  unitId?: string,
  moduleId?: string,
  importedFrom?: string,
): OutlineNode[] {
  const created: PageNode = {
    id: uid(),
    type: "page",
    title,
    pageType,
    scoringType,
    body: importedFrom ? `Imported from ${importedFrom}` : "",
    importedFrom,
  }
  if (!unitId) return [...outline, created]
  return outline.map((node) => {
    if (node.type !== "unit" || node.id !== unitId) return node
    if (!moduleId) return { ...node, expanded: true, items: [...node.items, created] }
    return {
      ...node,
      expanded: true,
      items: node.items.map((item) =>
        item.type === "module" && item.id === moduleId
          ? { ...item, expanded: true, pages: [...item.pages, created] }
          : item,
      ),
    }
  })
}

export type SettingsPatch = {
  title: string
  pageType?: PageType
  scoringType?: ScoringType
  body?: string
}

export function updateNode(outline: OutlineNode[], id: string, patch: SettingsPatch): OutlineNode[] {
  const visitPage = (page: PageNode): PageNode =>
    page.id === id
      ? {
          ...page,
          title: patch.title,
          pageType: patch.pageType ?? page.pageType,
          scoringType: patch.scoringType ?? page.scoringType,
          body: patch.body ?? page.body,
        }
      : page

  return outline.map((node) => {
    if (node.id === id && node.type === "page") return visitPage(node)
    if (node.id === id && node.type === "unit") return { ...node, title: patch.title }
    if (node.type !== "unit") return node
    return {
      ...node,
      items: node.items.map((item) => {
        if (item.id === id && item.type === "module") return { ...item, title: patch.title }
        if (item.id === id && item.type === "page") return visitPage(item)
        if (item.type !== "module") return item
        return { ...item, pages: item.pages.map(visitPage) }
      }),
    }
  })
}

export function removeNode(outline: OutlineNode[], id: string): OutlineNode[] {
  return outline
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.type !== "unit") return node
      return {
        ...node,
        items: node.items
          .filter((item) => item.id !== id)
          .map((item) =>
            item.type === "module"
              ? { ...item, pages: item.pages.filter((page) => page.id !== id) }
              : item,
          ),
      }
    })
}

export function duplicatePage(outline: OutlineNode[], id: string): OutlineNode[] {
  const located = locate(outline, id)
  if (!located || located.node.type !== "page") return outline
  const copy: PageNode = {
    ...located.node,
    id: uid(),
    title: `${located.node.title} copy`,
  }
  const next = structuredClone(outline) as OutlineNode[]
  const again = locate(next, id)
  if (!again) return outline
  again.parentList.splice(again.index + 1, 0, copy)
  return next
}

export function relocate(
  outline: OutlineNode[],
  dragId: string,
  targetId: string,
  place: DropPlace,
): OutlineNode[] | null {
  if (dragId === targetId) return null
  const source = locate(outline, dragId)
  const target = locate(outline, targetId)
  if (!source || !target) return null
  if (contains(source.node, targetId)) return null

  const moving = source.node
  let resolvedId = targetId
  let resolvedPlace = place

  if (moving.type === "unit") {
    const unitTarget =
      target.node.type === "unit"
        ? target
        : locate(outline, ancestorUnitId(outline, targetId) ?? "")
    if (!unitTarget || unitTarget.node.type !== "unit") return null
    resolvedId = unitTarget.node.id
    resolvedPlace = place === "after" ? "after" : "before"
  } else if (moving.type === "module") {
    if (target.node.type === "page") {
      const parent = parentOf(outline, targetId)
      if (!parent) return null
      if (parent.node.type === "module") {
        resolvedId = parent.node.id
        resolvedPlace = place === "after" ? "after" : "before"
      } else {
        resolvedId = targetId
        resolvedPlace = place === "after" ? "after" : "before"
      }
    } else if (target.node.type === "module" && place === "inside") {
      resolvedPlace = "after"
    }
    if (resolvedPlace === "inside" && locate(outline, resolvedId)?.node.type !== "unit") {
      return null
    }
  } else if (target.node.type === "page" && place === "inside") {
    resolvedPlace = "before"
  }

  const next = structuredClone(outline) as OutlineNode[]
  const detached = locate(next, dragId)
  const destination = locate(next, resolvedId)
  if (!detached || !destination) return null
  detached.parentList.splice(detached.index, 1)

  const dest = locate(next, resolvedId)
  if (!dest) return null

  if (resolvedPlace === "inside") {
    if (dest.node.type === "unit" && (moving.type === "module" || moving.type === "page")) {
      dest.node.expanded = true
      dest.node.items.push(moving as ModuleNode | PageNode)
      return next
    }
    if (dest.node.type === "module" && moving.type === "page") {
      dest.node.expanded = true
      dest.node.pages.push(moving)
      revealModule(next, dest.node.id)
      return next
    }
    return null
  }

  if (moving.type === "unit" && dest.parentList !== next) return null
  if (moving.type === "module" && dest.parentList === next) return null

  const index = resolvedPlace === "before" ? dest.index : dest.index + 1
  dest.parentList.splice(index, 0, moving)
  if (moving.type !== "unit") revealContainer(next, dest.parentList)
  return next
}

function ancestorUnitId(outline: OutlineNode[], id: string): string | null {
  for (const node of outline) {
    if (node.type !== "unit") continue
    if (node.id === id || contains(node, id)) return node.id
  }
  return null
}

function parentOf(outline: OutlineNode[], id: string): Located | null {
  for (const node of outline) {
    if (node.type === "unit") {
      if (node.items.some((item) => item.id === id)) return locate(outline, node.id)
      for (const item of node.items) {
        if (item.type === "module" && item.pages.some((page) => page.id === id)) {
          return locate(outline, item.id)
        }
      }
    }
  }
  return null
}

function revealModule(outline: OutlineNode[], moduleId: string) {
  for (const node of outline) {
    if (node.type !== "unit") continue
    if (node.items.some((item) => item.id === moduleId)) node.expanded = true
  }
}

function revealContainer(outline: OutlineNode[], list: CurriculumNode[]) {
  for (const node of outline) {
    if (node.type !== "unit") continue
    if (node.items === list) node.expanded = true
    for (const item of node.items) {
      if (item.type === "module" && item.pages === list) {
        node.expanded = true
        item.expanded = true
      }
    }
  }
}

export type MoveOption = {
  value: string
  label: string
  targetId: string
  place: DropPlace
}

export function moveOptions(outline: OutlineNode[], id: string): MoveOption[] {
  const located = locate(outline, id)
  if (!located) return []
  const options: MoveOption[] = []
  const push = (targetId: string, place: DropPlace, label: string) => {
    if (targetId === id && place !== "inside") return
    options.push({ value: `${place}:${targetId}`, targetId, place, label })
  }

  if (located.node.type === "unit") {
    outline.forEach((node) => {
      if (node.type === "unit" && node.id !== id) push(node.id, "before", `Before ${node.title}`)
    })
    const last = [...outline].reverse().find((node) => node.type === "unit" && node.id !== id)
    if (last) push(last.id, "after", "At the end of the course")
    return options
  }

  if (located.node.type === "module") {
    for (const node of outline) {
      if (node.type !== "unit") continue
      push(node.id, "inside", `Inside ${node.title}`)
      for (const item of node.items) {
        if (item.type === "module" && item.id !== id) {
          push(item.id, "before", `Before ${node.title} / ${item.title}`)
        }
      }
    }
    return options
  }

  for (const node of outline) {
    if (node.type === "page") {
      if (node.id !== id) push(node.id, "before", `Before top-level page ${node.title}`)
      continue
    }
    push(node.id, "inside", `Inside ${node.title}`)
    for (const item of node.items) {
      if (item.type === "page" && item.id !== id) {
        push(item.id, "before", `Before ${node.title} / ${item.title}`)
      }
      if (item.type === "module") {
        push(item.id, "inside", `Inside ${node.title} / ${item.title}`)
        for (const page of item.pages) {
          if (page.id !== id) {
            push(page.id, "before", `Before ${item.title} / ${page.title}`)
          }
        }
      }
    }
  }
  return options
}

export function filterOutline(outline: OutlineNode[], query: string): OutlineNode[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return outline
  const match = (title: string) => title.toLowerCase().includes(needle)
  const result: OutlineNode[] = []
  for (const node of outline) {
    if (node.type === "page") {
      if (match(node.title)) result.push(node)
      continue
    }
    if (match(node.title)) {
      result.push({ ...node, expanded: true })
      continue
    }
    const items: UnitNode["items"] = []
    for (const item of node.items) {
      if (item.type === "page") {
        if (match(item.title)) items.push(item)
        continue
      }
      if (match(item.title)) {
        items.push({ ...item, expanded: true })
        continue
      }
      const pages = item.pages.filter((page) => match(page.title))
      if (pages.length) items.push({ ...item, expanded: true, pages })
    }
    if (items.length) result.push({ ...node, expanded: true, items })
  }
  return result
}

export const pageTypeLabel: Record<PageType, string> = {
  basic: "Basic",
  simple: "Simple Author",
  advanced: "Advanced Author",
}

export const scoringLabel: Record<ScoringType, string> = {
  scored: "Scored",
  practice: "Practice",
}
