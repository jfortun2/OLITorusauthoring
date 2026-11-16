import {
  DragEvent,
  FormEvent,
  MouseEvent,
  MutableRefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  CurriculumView,
  DropPlace,
  FlatPage,
  OutlineNode,
  PageType,
  ScoringType,
  addModule,
  addPage,
  addUnit,
  anyExpanded,
  applyView,
  DEFAULT_THUMBNAIL,
  duplicatePage,
  filterOutline,
  findPage,
  findTitle,
  flattenPages,
  initialOutline,
  isFullyExpanded,
  moveOptions,
  pageTypeLabel,
  relocate,
  removeNode,
  scoringLabel,
  LearnerCardUpdate,
  setExpanded,
  setLearnerCard,
  ThumbnailTarget,
  thumbnailTarget,
  toggleModule,
  toggleUnit,
  updateNode,
} from "./curriculum"

type Screen = "curriculum" | "all-pages" | "page" | "section"
type CreateTarget =
  | { kind: "unit" }
  | { kind: "module"; unitId: string }
  | { kind: "page"; unitId?: string; moduleId?: string }

export default function App() {
  const [outline, setOutline] = useState<OutlineNode[]>(initialOutline)
  const [query, setQuery] = useState("")
  const [view, setView] = useState<CurriculumView>("default")
  const [screen, setScreen] = useState<Screen>("curriculum")
  const [sectionName, setSectionName] = useState("Overview")
  const [pageId, setPageId] = useState<string | null>(null)
  const [returnTo, setReturnTo] = useState<"curriculum" | "all-pages">("curriculum")
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(true)
  const [role, setRole] = useState("Course Author")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [moveId, setMoveId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [thumbnailId, setThumbnailId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [status, setStatus] = useState("")
  const [dropHint, setDropHint] = useState<{ id: string; place: DropPlace } | null>(null)
  const dragId = useRef<string | null>(null)

  const visible = useMemo(() => filterOutline(outline, query), [outline, query])
  const pages = useMemo(() => flattenPages(outline), [outline])
  const openPage = pageId ? findPage(outline, pageId) : null
  const thumbnail = thumbnailId ? thumbnailTarget(outline, thumbnailId) : null
  const expanded = anyExpanded(outline)
  const fullyExpanded = isFullyExpanded(outline)

  useEffect(() => {
    const close = () => setOpenMenu(null)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null)
    }
    window.addEventListener("click", close)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("click", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  const openCurriculum = () => {
    setScreen("curriculum")
    setPageId(null)
  }

  const showPage = (id: string, from: "curriculum" | "all-pages") => {
    setPageId(id)
    setReturnTo(from)
    setScreen("page")
    setOpenMenu(null)
  }

  const changeView = (next: CurriculumView) => {
    setView(next)
    setOutline((current) => applyView(current, next))
    setStatus(
      next === "detailed"
        ? "Detailed view. Every unit and module is expanded."
        : next === "learning"
          ? "Learning view. Units are expanded and modules are collapsed."
          : "Default view. The outline is collapsed.",
    )
  }

  const toggleExpandAll = () => {
    const next = !fullyExpanded
    setOutline((current) => setExpanded(current, next))
    setView(next ? "detailed" : "default")
    setStatus(next ? "Expanded the curriculum." : "Collapsed the curriculum.")
  }

  const openCreate = (target: CreateTarget) => {
    setCreateTarget(target)
    setOpenMenu(null)
  }

  const onDrop = (targetId: string) => {
    const sourceId = dragId.current
    const place = dropHint?.id === targetId ? dropHint.place : "inside"
    if (!sourceId) return
    setOutline((current) => relocate(current, sourceId, targetId, place) ?? current)
    dragId.current = null
    setDropHint(null)
    setStatus("Moved an item in the curriculum.")
  }

  return (
    <div className={navCollapsed ? "app nav-collapsed" : "app"}>
      <a className="skip" href="#main">
        Skip to curriculum
      </a>
      <header className="topbar">
        <a className="logo" href="#curriculum" onClick={openCurriculum}>
          <img src="/assets/logo.png" alt="OLI Torus" />
        </a>
        <h1>Intro to LTI Tools</h1>
        <button className="avatar" type="button" aria-label="Account menu for JF">
          JF
        </button>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Project">
          <button
            className="collapse-sidebar"
            type="button"
            aria-expanded={!navCollapsed}
            aria-label={navCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setNavCollapsed((current) => !current)}
          >
            <img src="/assets/icon-collapse.svg" alt="" />
          </button>
          <div className="side-scroll">
            <h2>WORKSPACE</h2>
            <div className="role-list">
              <RoleButton
                icon="/assets/icon-author.svg"
                label="Course Author"
                pressed={role === "Course Author"}
                onClick={() => setRole("Course Author")}
              />
              <RoleButton
                icon="/assets/icon-instructor.svg"
                label="Instructor"
                pressed={role === "Instructor"}
                onClick={() => setRole("Instructor")}
              />
              <RoleButton
                icon="/assets/icon-student.svg"
                label="Student"
                pressed={role === "Student"}
                onClick={() => setRole("Student")}
              />
            </div>
            <h2>INTRO TO LTI TOOLS</h2>
            <nav className="nav-list" aria-label="Project sections">
              <NavButton
                icon="/assets/icon-overview.svg"
                label="Overview"
                onClick={() => {
                  setSectionName("Overview")
                  setScreen("section")
                }}
              />
              <button
                className="nav-item"
                type="button"
                aria-expanded={createMenuOpen}
                onClick={() => setCreateMenuOpen((current) => !current)}
              >
                <span className="icon-slot">
                  <img src="/assets/icon-create.svg" alt="" />
                </span>
                <span className="nav-label">Create</span>
                <img
                  src="/assets/icon-chevron-down-lg.svg"
                  alt=""
                  style={createMenuOpen ? undefined : { transform: "rotate(-90deg)" }}
                />
              </button>
              {createMenuOpen && (
                <>
                  {["Objectives", "Activity Bank", "Experiments", "Bibliography"].map((label) => (
                    <button
                      key={label}
                      className="nav-item nested"
                      type="button"
                      onClick={() => {
                        setSectionName(label)
                        setScreen("section")
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    className="nav-item nested"
                    type="button"
                    aria-current={screen === "curriculum" || screen === "page" ? "page" : undefined}
                    onClick={openCurriculum}
                  >
                    Curriculum
                  </button>
                  <button
                    className="nav-item nested"
                    type="button"
                    aria-current={screen === "all-pages" ? "page" : undefined}
                    onClick={() => setScreen("all-pages")}
                  >
                    All Pages
                  </button>
                  <button
                    className="nav-item nested"
                    type="button"
                    onClick={() => {
                      setSectionName("All Activities")
                      setScreen("section")
                    }}
                  >
                    All Activities
                  </button>
                </>
              )}
              <NavButton
                icon="/assets/icon-publish.svg"
                label="Publish"
                chevron
                onClick={() => {
                  setSectionName("Publish")
                  setScreen("section")
                }}
              />
              <NavButton
                icon="/assets/icon-improve.svg"
                label="Improve"
                chevron
                onClick={() => {
                  setSectionName("Improve")
                  setScreen("section")
                }}
              />
            </nav>
          </div>
          <div className="side-footer">
            <button
              className="support"
              type="button"
              onClick={() => {
                setSectionName("Support")
                setScreen("section")
              }}
            >
              <span className="icon-slot">
                <img src="/assets/icon-support.svg" alt="" />
              </span>
              Support
            </button>
            <button
              className="exit"
              type="button"
              onClick={() => setStatus("Exit project is not available in this prototype.")}
            >
              <span className="icon-slot">
                <img src="/assets/icon-exit.svg" alt="" />
              </span>
              Exit Project
            </button>
          </div>
        </aside>

        <main className="main" id="main">
          {screen === "page" && openPage ? (
            <PageScreen
              location={openPage}
              onBack={() => setScreen(returnTo)}
              onChange={(body) =>
                setOutline((current) => updateNode(current, openPage.page.id, { title: openPage.page.title, body }))
              }
              onSettings={() => setSettingsId(openPage.page.id)}
            />
          ) : screen === "all-pages" ? (
            <AllPages pages={pages} onOpen={(id) => showPage(id, "all-pages")} />
          ) : screen === "section" ? (
            <SectionPanel name={sectionName} onBack={openCurriculum} />
          ) : (
            <section className="content" aria-labelledby="curriculum-heading">
              <h2 id="curriculum-heading">Curriculum</h2>
              <p className="lede">
                {expanded
                  ? "Create and arrange your learning materials below."
                  : "Create and arrange your learning materials."}
              </p>
              <div className="toolbar">
                <label className="search">
                  <img src="/assets/icon-search.svg" alt="" />
                  <input
                    value={query}
                    aria-label="Search curriculum"
                    placeholder="Search curriculum..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <div className="view-controls">
                  <span id="view-label">Curriculum view:</span>
                  <div role="radiogroup" aria-labelledby="view-label" style={{ display: "flex", gap: 12 }}>
                    {(
                      [
                        ["default", "Default"],
                        ["detailed", "Detailed"],
                        ["learning", "Learning"],
                      ] as const
                    ).map(([value, label]) => (
                      <label className="view-option" key={value}>
                        <input
                          type="radio"
                          name="curriculum-view"
                          value={value}
                          checked={view === value}
                          onChange={() => changeView(value)}
                        />
                        <span className={view === value ? "radio on" : "radio"}>
                          {view === value && <img src="/assets/icon-radio.svg" alt="" />}
                        </span>
                        {label}
                      </label>
                    ))}
                  </div>
                  <button className={fullyExpanded ? "expand-all collapsed" : "expand-all"} type="button" onClick={toggleExpandAll}>
                    <img src="/assets/icon-expand-all.svg" alt="" />
                    {fullyExpanded ? "Collapse All" : "Expand All"}
                  </button>
                </div>
              </div>

              <div className="structure">
                <div className="structure-head">
                  <h3>Course structure</h3>
                  <div className="head-actions">
                    <button className="btn secondary" type="button" onClick={() => openCreate({ kind: "page" })}>
                      <img src="/assets/icon-plus.svg" alt="" />
                      Create page
                    </button>
                    <button className="btn primary" type="button" onClick={() => openCreate({ kind: "unit" })}>
                      <img src="/assets/icon-plus-white.svg" alt="" />
                      Create unit
                    </button>
                  </div>
                </div>
                <div className="outline" aria-label="Course outline">
                  {visible.length === 0 && (
                    <div className="empty">No curriculum items match “{query.trim()}”.</div>
                  )}
                  {visible.map((node) =>
                    node.type === "page" ? (
                      <PageRow
                        key={node.id}
                        title={node.title}
                        depth="top"
                        thumbnail={node.thumbnail}
                        onEditThumbnail={() => setThumbnailId(node.id)}
                        menuOpen={openMenu === `page-${node.id}`}
                        dragging={dragId.current === node.id}
                        dropPlace={dropHint?.id === node.id ? dropHint.place : null}
                        onOpen={() => showPage(node.id, "curriculum")}
                        onToggleMenu={() =>
                          setOpenMenu(openMenu === `page-${node.id}` ? null : `page-${node.id}`)
                        }
                        onAction={(action) => {
                          setOpenMenu(null)
                          handleRowAction(action, node.id, {
                            setSettingsId,
                            setMoveId,
                            setDeleteId,
                            setOutline,
                            showPage,
                            setStatus,
                          })
                        }}
                        onDragStart={() => {
                          dragId.current = node.id
                        }}
                        onDragEnd={() => {
                          dragId.current = null
                          setDropHint(null)
                        }}
                        onDragOver={(place) => setDropHint({ id: node.id, place })}
                        onDrop={() => onDrop(node.id)}
                      />
                    ) : (
                      <UnitBlock
                        key={node.id}
                        unit={node}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        dragId={dragId}
                        dropHint={dropHint}
                        setDropHint={setDropHint}
                        onToggle={() => {
                          setOutline((current) => toggleUnit(current, node.id))
                          setView("default")
                        }}
                        onToggleModule={(moduleId) => {
                          setOutline((current) => toggleModule(current, node.id, moduleId))
                          setView("default")
                        }}
                        onOpenPage={(id) => showPage(id, "curriculum")}
                        onEditThumbnail={setThumbnailId}
                        onCreate={openCreate}
                        onAction={(action, id) => {
                          setOpenMenu(null)
                          handleRowAction(action, id, {
                            setSettingsId,
                            setMoveId,
                            setDeleteId,
                            setOutline,
                            showPage,
                            setStatus,
                          })
                        }}
                        onDragStart={(id) => {
                          dragId.current = id
                        }}
                        onDragEnd={() => {
                          dragId.current = null
                          setDropHint(null)
                        }}
                        onDrop={onDrop}
                      />
                    ),
                  )}
                </div>
              </div>

              <div className="footer-actions">
                <button className="btn secondary" type="button" onClick={() => setImportOpen(true)}>
                  <img src="/assets/icon-import.svg" alt="" />
                  Import from Google Docs
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {createTarget && (
        <CreateDialog
          target={createTarget}
          onClose={() => setCreateTarget(null)}
          onSubmit={(name, pageType, scoringType) => {
            setOutline((current) => {
              if (createTarget.kind === "unit") return addUnit(current, name)
              if (createTarget.kind === "module") return addModule(current, createTarget.unitId, name)
              return addPage(
                current,
                name,
                pageType ?? "basic",
                scoringType ?? "practice",
                createTarget.unitId,
                createTarget.moduleId,
              )
            })
            setStatus(`Created ${createTarget.kind} ${name}.`)
            setCreateTarget(null)
          }}
        />
      )}

      {settingsId && (
        <SettingsDialog
          id={settingsId}
          outline={outline}
          onClose={() => setSettingsId(null)}
          onSave={(patch) => {
            setOutline((current) => updateNode(current, settingsId, patch))
            setStatus(`Saved settings for ${patch.title}.`)
            setSettingsId(null)
          }}
          onDelete={() => {
            setDeleteId(settingsId)
            setSettingsId(null)
          }}
          onEditThumbnail={
            thumbnailTarget(outline, settingsId)
              ? () => {
                  setThumbnailId(settingsId)
                  setSettingsId(null)
                }
              : undefined
          }
        />
      )}

      {thumbnail && (
        <ThumbnailDialog
          target={thumbnail}
          onClose={() => setThumbnailId(null)}
          onSave={(next) => {
            setOutline((current) => setLearnerCard(current, thumbnail.id, next))
            setStatus(`Saved the learner card for ${thumbnail.title}.`)
            setThumbnailId(null)
          }}
        />
      )}

      {moveId && (
        <MoveDialog
          id={moveId}
          outline={outline}
          onClose={() => setMoveId(null)}
          onMove={(targetId, place) => {
            setOutline((current) => relocate(current, moveId, targetId, place) ?? current)
            setStatus("Moved the item.")
            setMoveId(null)
          }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title={`Delete ${findTitle(outline, deleteId) ?? "item"}?`}
          body="This removes the item and anything inside it from the curriculum."
          confirmLabel="Delete"
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            if (pageId === deleteId) {
              setScreen(returnTo)
              setPageId(null)
            }
            setOutline((current) => removeNode(current, deleteId))
            setStatus("Deleted the item.")
            setDeleteId(null)
          }}
        />
      )}

      {importOpen && (
        <ImportDialog
          onClose={() => setImportOpen(false)}
          onImport={(name, url) => {
            setOutline((current) => addPage(current, name, "basic", "practice", undefined, undefined, url))
            setStatus(`Imported ${name}.`)
            setImportOpen(false)
          }}
        />
      )}
    </div>
  )
}

function handleRowAction(
  action: string,
  id: string,
  api: {
    setSettingsId: (id: string) => void
    setMoveId: (id: string) => void
    setDeleteId: (id: string) => void
    setOutline: (value: OutlineNode[] | ((current: OutlineNode[]) => OutlineNode[])) => void
    showPage: (id: string, from: "curriculum" | "all-pages") => void
    setStatus: (message: string) => void
  },
) {
  if (action === "Settings" || action === "Rename") api.setSettingsId(id)
  if (action === "Move") api.setMoveId(id)
  if (action === "Delete") api.setDeleteId(id)
  if (action === "Duplicate") {
    api.setOutline((current) => duplicatePage(current, id))
    api.setStatus("Duplicated the page.")
  }
  if (action === "Preview") api.showPage(id, "curriculum")
}

function RoleButton({
  icon,
  label,
  pressed,
  onClick,
}: {
  icon: string
  label: string
  pressed: boolean
  onClick: () => void
}) {
  return (
    <button className="role" type="button" aria-pressed={pressed} onClick={onClick}>
      <span className="icon-slot">
        <img src={icon} alt="" />
      </span>
      {label}
    </button>
  )
}

function NavButton({
  icon,
  label,
  chevron,
  onClick,
}: {
  icon: string
  label: string
  chevron?: boolean
  onClick: () => void
}) {
  return (
    <button className="nav-item" type="button" onClick={onClick}>
      <span className="icon-slot">
        <img src={icon} alt="" />
      </span>
      <span className="nav-label">{label}</span>
      {chevron && (
        <img src="/assets/icon-nav-chevron-2.svg" alt="" style={{ transform: "rotate(-90deg)" }} />
      )}
    </button>
  )
}

function UnitBlock({
  unit,
  openMenu,
  setOpenMenu,
  dragId,
  dropHint,
  setDropHint,
  onToggle,
  onToggleModule,
  onOpenPage,
  onEditThumbnail,
  onCreate,
  onAction,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  unit: Extract<OutlineNode, { type: "unit" }>
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  dragId: MutableRefObject<string | null>
  dropHint: { id: string; place: DropPlace } | null
  setDropHint: (hint: { id: string; place: DropPlace } | null) => void
  onToggle: () => void
  onToggleModule: (moduleId: string) => void
  onOpenPage: (id: string) => void
  onEditThumbnail: (id: string) => void
  onCreate: (target: CreateTarget) => void
  onAction: (action: string, id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: (id: string) => void
}) {
  const menuId = `unit-${unit.id}`
  const createId = `create-${unit.id}`
  return (
    <div>
      <div
        className={rowClass("unit", dragId.current === unit.id, dropHint?.id === unit.id ? dropHint.place : null)}
        onDragOver={(event) => {
          event.preventDefault()
          setDropHint({ id: unit.id, place: dropPlace(event) })
        }}
        onDrop={(event) => {
          event.preventDefault()
          onDrop(unit.id)
        }}
      >
        <Grip
          label={unit.title}
          onDragStart={() => onDragStart(unit.id)}
          onDragEnd={onDragEnd}
        />
        <button className="expand" type="button" aria-expanded={unit.expanded} aria-label={`${unit.expanded ? "Collapse" : "Expand"} ${unit.title}`} onClick={onToggle}>
          <img className={unit.expanded ? "open" : ""} src="/assets/icon-chevron-right.svg" alt="" />
        </button>
        <ThumbnailButton title={unit.title} src={unit.thumbnail} onClick={() => onEditThumbnail(unit.id)} />
        <i className="fas fa-archive kind-icon" aria-hidden="true" />
        <button className="row-title" type="button" onClick={onToggle}>
          {unit.title}
        </button>
        <div className="row-actions">
          <div className="menu-anchor">
            <button
              className="btn secondary create-row"
              type="button"
              aria-expanded={openMenu === createId}
              aria-haspopup="menu"
              onClick={(event) => {
                event.stopPropagation()
                setOpenMenu(openMenu === createId ? null : createId)
              }}
            >
              <img src="/assets/icon-plus.svg" alt="" />
              <span className="label">Create</span>
              <img src="/assets/icon-chevron-down.svg" alt="" />
            </button>
            {openMenu === createId && (
              <CreateMenu
                allowModule
                onModule={() => onCreate({ kind: "module", unitId: unit.id })}
                onPage={() => onCreate({ kind: "page", unitId: unit.id })}
              />
            )}
          </div>
          <MoreMenu
            open={openMenu === menuId}
            page={false}
            onToggle={(event) => {
              event.stopPropagation()
              setOpenMenu(openMenu === menuId ? null : menuId)
            }}
            onAction={(action) => onAction(action, unit.id)}
          />
        </div>
      </div>
      {unit.expanded &&
        unit.items.map((item) =>
          item.type === "module" ? (
            <div key={item.id}>
              <div
                className={rowClass("module", dragId.current === item.id, dropHint?.id === item.id ? dropHint.place : null)}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropHint({ id: item.id, place: dropPlace(event) })
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  onDrop(item.id)
                }}
              >
                <Grip label={item.title} onDragStart={() => onDragStart(item.id)} onDragEnd={onDragEnd} />
                <button
                  className="expand"
                  type="button"
                  aria-expanded={item.expanded}
                  aria-label={`${item.expanded ? "Collapse" : "Expand"} ${item.title}`}
                  onClick={() => onToggleModule(item.id)}
                >
                  <img className={item.expanded ? "open" : ""} src="/assets/icon-chevron-right.svg" alt="" />
                </button>
                <ThumbnailButton title={item.title} src={item.thumbnail} onClick={() => onEditThumbnail(item.id)} />
                <i className="fas fa-archive kind-icon" aria-hidden="true" />
                <button className="row-title" type="button" onClick={() => onToggleModule(item.id)}>
                  {item.title}
                </button>
                <div className="row-actions">
                  <div className="menu-anchor">
                    <button
                      className="btn secondary create-row"
                      type="button"
                      aria-expanded={openMenu === `create-${item.id}`}
                      aria-haspopup="menu"
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenu(openMenu === `create-${item.id}` ? null : `create-${item.id}`)
                      }}
                    >
                      <img src="/assets/icon-plus.svg" alt="" />
                      <span className="label">Create</span>
                      <img src="/assets/icon-chevron-down.svg" alt="" />
                    </button>
                    {openMenu === `create-${item.id}` && (
                      <CreateMenu
                        allowModule={false}
                        onModule={() => onCreate({ kind: "module", unitId: unit.id })}
                        onPage={() => onCreate({ kind: "page", unitId: unit.id, moduleId: item.id })}
                      />
                    )}
                  </div>
                  <MoreMenu
                    open={openMenu === `module-${item.id}`}
                    page={false}
                    onToggle={(event) => {
                      event.stopPropagation()
                      setOpenMenu(openMenu === `module-${item.id}` ? null : `module-${item.id}`)
                    }}
                    onAction={(action) => onAction(action, item.id)}
                  />
                </div>
              </div>
              {item.expanded &&
                item.pages.map((page) => (
                  <PageRow
                    key={page.id}
                    title={page.title}
                    depth="page"
                    menuOpen={openMenu === `page-${page.id}`}
                    dragging={dragId.current === page.id}
                    dropPlace={dropHint?.id === page.id ? dropHint.place : null}
                    onOpen={() => onOpenPage(page.id)}
                    onToggleMenu={() =>
                      setOpenMenu(openMenu === `page-${page.id}` ? null : `page-${page.id}`)
                    }
                    onAction={(action) => onAction(action, page.id)}
                    onDragStart={() => onDragStart(page.id)}
                    onDragEnd={onDragEnd}
                    onDragOver={(place) => setDropHint({ id: page.id, place })}
                    onDrop={() => onDrop(page.id)}
                  />
                ))}
            </div>
          ) : (
            <PageRow
              key={item.id}
              title={item.title}
              depth="unit"
              menuOpen={openMenu === `page-${item.id}`}
              dragging={dragId.current === item.id}
              dropPlace={dropHint?.id === item.id ? dropHint.place : null}
              onOpen={() => onOpenPage(item.id)}
              onToggleMenu={() => setOpenMenu(openMenu === `page-${item.id}` ? null : `page-${item.id}`)}
              onAction={(action) => onAction(action, item.id)}
              onDragStart={() => onDragStart(item.id)}
              onDragEnd={onDragEnd}
              onDragOver={(place) => setDropHint({ id: item.id, place })}
              onDrop={() => onDrop(item.id)}
            />
          ),
        )}
    </div>
  )
}

function PageRow({
  title,
  depth,
  thumbnail,
  onEditThumbnail,
  menuOpen,
  dragging,
  dropPlace: hint,
  onOpen,
  onToggleMenu,
  onAction,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  title: string
  depth: "top" | "unit" | "page"
  thumbnail?: string
  onEditThumbnail?: () => void
  menuOpen: boolean
  dragging: boolean
  dropPlace: DropPlace | null
  onOpen: () => void
  onToggleMenu: () => void
  onAction: (action: string) => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (place: DropPlace) => void
  onDrop: () => void
}) {
  return (
    <div
      className={rowClass(depth === "top" ? "top" : depth === "unit" ? "unit-page" : "page", dragging, hint)}
      onDragOver={(event) => {
        event.preventDefault()
        onDragOver(dropPlace(event))
      }}
      onDrop={(event) => {
        event.preventDefault()
        onDrop()
      }}
    >
      <Grip label={title} onDragStart={onDragStart} onDragEnd={onDragEnd} />
      {depth === "top" && <span className="row-spacer" aria-hidden="true" />}
      {onEditThumbnail && (
        <ThumbnailButton title={title} src={thumbnail} onClick={onEditThumbnail} />
      )}
      <i className="far fa-file-alt kind-icon" aria-hidden="true" />
      <button className="page-link" type="button" onClick={onOpen}>
        {title}
      </button>
      <MoreMenu
        open={menuOpen}
        page
        onToggle={(event) => {
          event.stopPropagation()
          onToggleMenu()
        }}
        onAction={onAction}
      />
      </div>
  )
}

function Grip({
  label,
  onDragStart,
  onDragEnd,
}: {
  label: string
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <button
      className="grip"
      type="button"
      draggable
      aria-label={`Drag ${label}`}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move"
        event.dataTransfer.setData("text/plain", label)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
    >
      <img src="/assets/icon-grip-line.svg" alt="" />
      <img src="/assets/icon-grip-line.svg" alt="" />
      <img src="/assets/icon-grip-line.svg" alt="" />
    </button>
  )
}

function MoreMenu({
  open,
  page,
  onToggle,
  onAction,
}: {
  open: boolean
  page: boolean
  onToggle: (event: MouseEvent) => void
  onAction: (action: string) => void
}) {
  const items: Array<[string, string, boolean]> = page
    ? [
        ["Settings", "/assets/menu-page-settings.svg", false],
        ["Rename", "/assets/menu-rename.svg", true],
        ["Move", "/assets/menu-move.svg", true],
        ["Duplicate", "/assets/menu-duplicate.svg", false],
        ["Preview", "/assets/menu-preview.svg", false],
        ["Delete", "/assets/menu-delete.svg", false],
      ]
    : [
        ["Settings", "/assets/menu-settings.svg", false],
        ["Rename", "/assets/menu-rename.svg", true],
        ["Move", "/assets/menu-move.svg", true],
        ["Delete", "/assets/menu-delete.svg", false],
      ]
  return (
    <div className="menu-anchor">
      <button className="more-button" type="button" aria-label="More options" aria-expanded={open} aria-haspopup="menu" onClick={onToggle}>
        <img src="/assets/icon-more.svg" alt="" />
      </button>
      {open && (
        <div className="menu" role="menu" onClick={(event) => event.stopPropagation()}>
          {items.map(([label, icon, large]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className={label === "Delete" ? "destructive" : ""}
              onClick={() => onAction(label)}
            >
              <span className={large ? "menu-icon large" : "menu-icon"}>
                <img src={icon} alt="" />
              </span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateMenu({
  allowModule,
  onModule,
  onPage,
}: {
  allowModule: boolean
  onModule: () => void
  onPage: () => void
}) {
  return (
    <div className="menu create-menu" role="menu" onClick={(event) => event.stopPropagation()}>
      <p>Create inside this container</p>
      {allowModule && (
        <button type="button" role="menuitem" onClick={onModule}>
          <i className="fas fa-archive kind-icon" aria-hidden="true" />
          Module
        </button>
      )}
      <button type="button" role="menuitem" onClick={onPage}>
        <i className="far fa-file-alt kind-icon" aria-hidden="true" />
        Page
      </button>
    </div>
  )
}

function rowClass(kind: string, dragging: boolean, place: DropPlace | null) {
  const depth =
    kind === "module" ? "module" : kind === "page" ? "page" : kind === "unit-page" ? "unit-page" : kind === "top" ? "top-page" : ""
  return ["row", depth, dragging ? "dragging" : "", place ? `drop-${place}` : ""].filter(Boolean).join(" ")
}

function dropPlace(event: DragEvent<HTMLDivElement>): DropPlace {
  const rect = event.currentTarget.getBoundingClientRect()
  const offset = event.clientY - rect.top
  if (offset < 16) return "before"
  if (offset > rect.height - 16) return "after"
  return "inside"
}

function PageScreen({
  location,
  onBack,
  onChange,
  onSettings,
}: {
  location: NonNullable<ReturnType<typeof findPage>>
  onBack: () => void
  onChange: (body: string) => void
  onSettings: () => void
}) {
  const fieldId = useId()
  return (
    <section className="content" aria-labelledby="page-heading">
      <div className="crumb">
        <button type="button" onClick={onBack}>
          Curriculum
        </button>
        {location.unit && <span>/ {location.unit.title}</span>}
        {location.module && <span>/ {location.module.title}</span>}
        <span>/ {location.page.title}</span>
      </div>
      <h2 id="page-heading">{location.page.title}</h2>
      <div className="meta">
        <span>{pageTypeLabel[location.page.pageType]}</span>
        <span>{scoringLabel[location.page.scoringType]}</span>
        {location.page.importedFrom && <span>Imported</span>}
      </div>
      <div className="editor">
        <label htmlFor={fieldId}>Page content</label>
        <textarea
          id={fieldId}
          value={location.page.body}
          placeholder="Add the content for this page."
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="dialog-actions">
          <button className="btn secondary" type="button" onClick={onSettings}>
            Edit settings
          </button>
        </div>
      </div>
    </section>
  )
}

function AllPages({ pages, onOpen }: { pages: FlatPage[]; onOpen: (id: string) => void }) {
  return (
    <section className="content" aria-labelledby="pages-heading">
      <h2 id="pages-heading">All Pages</h2>
      <p className="lede">Open any page in this project.</p>
      <div className="outline page-list">
        {pages.map((entry) => (
          <button key={entry.page.id} className="page-row-link" type="button" onClick={() => onOpen(entry.page.id)}>
            <strong>{entry.page.title}</strong>
            <span>{entry.trail}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function SectionPanel({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <section className="content">
      <h2>{name}</h2>
      <div className="placeholder">
        <p>This section is separate from the curriculum outline.</p>
        <button className="btn secondary" type="button" onClick={onBack}>
          Back to curriculum
        </button>
      </div>
    </section>
  )
}

function CreateDialog({
  target,
  onClose,
  onSubmit,
}: {
  target: CreateTarget
  onClose: () => void
  onSubmit: (name: string, pageType?: PageType, scoringType?: ScoringType) => void
}) {
  const titleId = useId()
  const [name, setName] = useState("")
  const [pageType, setPageType] = useState<PageType | "">("")
  const [scoringType, setScoringType] = useState<ScoringType | "">("")
  const ref = useDialog<HTMLFormElement>(onClose)
  const heading = `Create ${target.kind[0].toUpperCase()}${target.kind.slice(1)}`
  const placeholder =
    target.kind === "unit" ? "New unit...." : target.kind === "module" ? "New module...." : "New page...."

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (target.kind === "page" && (!pageType || !scoringType)) return
    onSubmit(trimmed, pageType || undefined, scoringType || undefined)
  }

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form
        ref={ref}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id={titleId}>{heading}</h2>
        <div className="dialog-rule">
          <img src="/assets/dialog-rule.svg" alt="" />
        </div>
        <label className="field">
          <span>Name</span>
          <input value={name} placeholder={placeholder} autoFocus required onChange={(event) => setName(event.target.value)} />
        </label>
        {target.kind === "page" && (
          <>
            <fieldset className="options">
              <legend>Page Type</legend>
              <PageTypeOption
                group="page-type"
                value="basic"
                title="Basic"
                detail="Author basic elements such as paragraphs, images, and activities."
                checked={pageType === "basic"}
                onChange={() => setPageType("basic")}
              />
              <PageTypeOption
                group="page-type"
                value="simple"
                title="Simple Author"
                detail="Easily build lessons using templates, simplified interactions, and conditioning."
                checked={pageType === "simple"}
                onChange={() => setPageType("simple")}
              />
              <PageTypeOption
                group="page-type"
                value="advanced"
                title="Advanced Author"
                detail="Build complex lessons using extended logic rules and CSS editing."
                checked={pageType === "advanced"}
                onChange={() => setPageType("advanced")}
              />
            </fieldset>
            <fieldset className="options">
              <legend>Scoring Type</legend>
              <PageTypeOption group="scoring-type" value="scored" title="Scored" checked={scoringType === "scored"} onChange={() => setScoringType("scored")} />
              <PageTypeOption group="scoring-type" value="practice" title="Practice" checked={scoringType === "practice"} onChange={() => setScoringType("practice")} />
            </fieldset>
          </>
        )}
        <div className="dialog-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="submit">
            Create
          </button>
        </div>
      </form>
    </div>
  )
}

function PageTypeOption({
  group,
  value,
  title,
  detail,
  checked,
  onChange,
  required = true,
}: {
  group: string
  value: string
  title: string
  detail?: string
  checked: boolean
  onChange: () => void
  required?: boolean
}) {
  return (
    <label>
      <input type="radio" name={group} value={value} checked={checked} required={required} onChange={onChange} />
      <span>
        <b>{title}</b>
        {detail && <small>{detail}</small>}
      </span>
    </label>
  )
}

function SettingsDialog({
  id,
  outline,
  onClose,
  onSave,
  onDelete,
  onEditThumbnail,
}: {
  id: string
  outline: OutlineNode[]
  onClose: () => void
  onSave: (patch: { title: string; pageType?: PageType; scoringType?: ScoringType }) => void
  onDelete: () => void
  onEditThumbnail?: () => void
}) {
  const located = findPage(outline, id)
  const title = located?.page.title ?? findTitle(outline, id) ?? ""
  const [draft, setDraft] = useState(title)
  const [pageType, setPageType] = useState<PageType>(located?.page.pageType ?? "basic")
  const [scoringType, setScoringType] = useState<ScoringType>(located?.page.scoringType ?? "scored")
  const titleId = useId()
  const fieldId = useId()
  const ref = useDialog<HTMLFormElement>(onClose)
  const isPage = Boolean(located)

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form
        ref={ref}
        className="dialog wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!draft.trim()) return
          onSave({
            title: draft.trim(),
            pageType: isPage ? pageType : undefined,
            scoringType: isPage ? scoringType : undefined,
          })
        }}
      >
        <div className="dialog-header">
          <h2 id={titleId}>Settings</h2>
          <button type="button" aria-label="Close settings" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="dialog-body">
          <label className="field" htmlFor={fieldId}>
            <span>Title</span>
            <input id={fieldId} value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} />
          </label>
          {isPage && (
            <>
              <fieldset className="options">
                <legend>Page Type</legend>
                {(["basic", "simple", "advanced"] as const).map((value) => (
                  <PageTypeOption
                    key={value}
                    group="settings-page-type"
                    value={value}
                    title={pageTypeLabel[value]}
                    checked={pageType === value}
                    required={false}
                    onChange={() => setPageType(value)}
                  />
                ))}
              </fieldset>
              <fieldset className="options">
                <legend>Scoring Type</legend>
                {(["scored", "practice"] as const).map((value) => (
                  <PageTypeOption
                    key={value}
                    group="settings-scoring-type"
                    value={value}
                    title={scoringLabel[value]}
                    checked={scoringType === value}
                    required={false}
                    onChange={() => setScoringType(value)}
                  />
                ))}
              </fieldset>
            </>
          )}
          <p>Update how this item appears in the curriculum outline.</p>
          {onEditThumbnail && (
            <button className="btn secondary thumb-settings" type="button" onClick={onEditThumbnail}>
              Edit thumbnail
            </button>
          )}
        </div>
        <div className="dialog-footer">
          <button className="linkish" type="button" onClick={onDelete}>
            Delete
          </button>
          <span className="spacer" />
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="submit">
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}

function MoveDialog({
  id,
  outline,
  onClose,
  onMove,
}: {
  id: string
  outline: OutlineNode[]
  onClose: () => void
  onMove: (targetId: string, place: DropPlace) => void
}) {
  const options = moveOptions(outline, id)
  const [choice, setChoice] = useState(options[0]?.value ?? "")
  const titleId = useId()
  const ref = useDialog<HTMLFormElement>(onClose)
  const selected = options.find((option) => option.value === choice)

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form
        ref={ref}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (selected) onMove(selected.targetId, selected.place)
        }}
      >
        <h2 id={titleId}>Move {findTitle(outline, id)}</h2>
        <div className="dialog-rule">
          <img src="/assets/dialog-rule.svg" alt="" />
        </div>
        <label className="field">
          <span>Destination</span>
          <select value={choice} onChange={(event) => setChoice(event.target.value)}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="dialog-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="submit" disabled={!selected}>
            Move
          </button>
        </div>
      </form>
    </div>
  )
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
}) {
  const titleId = useId()
  const ref = useDialog<HTMLDivElement>(onClose)
  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        ref={ref}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{body}</p>
        <div className="dialog-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="button" onClick={onConfirm} style={{ background: "#b60202" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ImportDialog({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (name: string, url: string) => void
}) {
  const titleId = useId()
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const ref = useDialog<HTMLFormElement>(onClose)
  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form
        ref={ref}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          onImport(name.trim(), url.trim() || "Google Docs")
        }}
      >
        <h2 id={titleId}>Import from Google Docs</h2>
        <div className="dialog-rule">
          <img src="/assets/dialog-rule.svg" alt="" />
        </div>
        <label className="field">
          <span>Page name</span>
          <input value={name} autoFocus required placeholder="Imported page...." onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field" style={{ marginTop: 16 }}>
          <span>Document link</span>
          <input value={url} placeholder="https://" onChange={(event) => setUrl(event.target.value)} />
        </label>
        <div className="dialog-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="submit">
            Import
          </button>
        </div>
      </form>
    </div>
  )
}

function ThumbnailButton({
  title,
  src,
  onClick,
}: {
  title: string
  src?: string
  onClick: () => void
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const shown = !src || failed ? DEFAULT_THUMBNAIL : src
  return (
    <button
      className="thumb"
      type="button"
      aria-label={`Edit thumbnail for ${title}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <img
        src={shown}
        alt=""
        onError={() => {
          if (shown !== DEFAULT_THUMBNAIL) setFailed(true)
        }}
      />
      <span className="thumb-edit" aria-hidden="true">
        <img src="/assets/icon-edit.svg" alt="" />
        Edit
      </span>
    </button>
  )
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 80 * 1024 * 1024

function readImageFile(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) {
    return Promise.reject(new Error("That file can’t be used. Choose a PNG, JPG, WEBP, or GIF."))
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error("That file is too large. Choose an image under 5 MB."))
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("That file couldn’t be read. Try a different image."))
    reader.readAsDataURL(file)
  }).then(
    (url) =>
      new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve({ url, width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () =>
          reject(new Error("That file couldn’t be used as an image. Choose a PNG, JPG, WEBP, or GIF."))
        image.src = url
      }),
  )
}

function readVideoFile(file: File) {
  const allowed = VIDEO_TYPES.includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name)
  if (!allowed) {
    return Promise.reject(new Error("That file can’t be used. Choose an MP4, WEBM, or MOV video."))
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return Promise.reject(new Error("That video is too large. Choose one under 80 MB."))
  }
  return Promise.resolve({ url: URL.createObjectURL(file), name: file.name })
}

function ThumbnailDialog({
  target,
  onClose,
  onSave,
}: {
  target: ThumbnailTarget
  onClose: () => void
  onSave: (card: LearnerCardUpdate) => void
}) {
  const titleId = useId()
  const noteId = useId()
  const introId = useId()
  const ref = useDialog<HTMLFormElement>(onClose)
  const [draft, setDraft] = useState(target.thumbnail)
  const [intro, setIntro] = useState(target.intro ?? "")
  const [video, setVideo] = useState(target.video)
  const [videoName, setVideoName] = useState(target.videoName ?? "")
  const [fileMeta, setFileMeta] = useState<{ name: string; width: number; height: number } | null>(null)
  const [error, setError] = useState("")
  const preview = draft ?? DEFAULT_THUMBNAIL
  const dirty =
    draft !== target.thumbnail ||
    intro.trim() !== (target.intro ?? "") ||
    video !== target.video
  const kind = target.kind === "unit" ? "Unit" : target.kind === "module" ? "Module" : "Page"
  const count =
    target.pageCount === null
      ? null
      : `${target.pageCount} ${target.pageCount === 1 ? "page" : "pages"}`

  const replaceVideo = (next: { url: string; name: string } | null) => {
    setVideo((current) => {
      if (current && current.startsWith("blob:") && current !== target.video) URL.revokeObjectURL(current)
      return next?.url
    })
    setVideoName(next?.name ?? "")
  }

  const onPick = (file: File | undefined) => {
    if (!file) return
    readImageFile(file).then(
      (image) => {
        setDraft(image.url)
        setFileMeta({ name: file.name, width: image.width, height: image.height })
        setError("")
      },
      (reason: Error) => setError(reason.message),
    )
  }

  const onPickVideo = (file: File | undefined) => {
    if (!file) return
    readVideoFile(file).then(
      (next) => {
        replaceVideo(next)
        setError("")
      },
      (reason: Error) => setError(reason.message),
    )
  }

  return (
    <div className="backdrop thumb-backdrop" onMouseDown={onClose}>
      <form
        ref={ref}
        className="dialog thumbnail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={noteId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!dirty) return
          onSave({
            thumbnail: draft,
            intro: intro.trim() || undefined,
            video,
            videoName: video ? videoName || target.videoName : undefined,
          })
        }}
      >
        <button className="thumb-close" type="button" aria-label="Close" data-initial-focus="true" onClick={onClose}>
          <img src="/assets/icon-close.svg" alt="" />
        </button>
        <h2 id={titleId}>Edit Thumbnail</h2>
        <p id={noteId} className="thumb-note">
          This is the card learners see. Add an introduction, a cover image, and a video if you want one.
        </p>
        <label className="field" htmlFor={introId}>
          <span>Introduction content</span>
          <input
            id={introId}
            value={intro}
            placeholder="A short introduction for learners"
            onChange={(event) => setIntro(event.target.value)}
          />
        </label>
        <div className="thumb-columns">
          <div className="thumb-column">
            <div className="learner-card">
              <img src={preview} alt="" />
              <div className="learner-scrim" />
              <div className="learner-copy">
                <p className="learner-kind">{kind}</p>
                <p className="learner-title">{target.title}</p>
              </div>
              {count && <p className="learner-count">{count}</p>}
            </div>
            <p className="thumb-size">Image Size: 294 x 170 pixels</p>
            <p className="thumb-file">
              {!draft && !fileMeta
                ? "Using the default image."
                : fileMeta
                  ? `${fileMeta.name} · ${fileMeta.width} × ${fileMeta.height} px`
                  : "\u00a0"}
            </p>
            <label className="btn primary file-btn">
              Select new image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  onPick(file)
                }}
              />
            </label>
          </div>
          <div className="thumb-column">
            <div className="video-drop">
              {video ? (
                <video src={video} controls />
              ) : (
                <span className="video-plus" aria-hidden="true">
                  <i className="fas fa-plus-circle" />
                </span>
              )}
            </div>
            <p className="thumb-size">{video ? "Video selected" : "Video is optional"}</p>
            <p className="thumb-file">{videoName || "\u00a0"}</p>
            <label className="btn primary file-btn">
              Select video
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  onPickVideo(file)
                }}
              />
            </label>
            {video && (
              <button className="thumb-link" type="button" onClick={() => replaceVideo(null)}>
                Remove video
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="thumb-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button className="btn secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="submit" disabled={!dirty}>
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

function useDialog<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const node = ref.current
    const previous = document.activeElement as HTMLElement | null
    const getItems = () =>
      [...(node?.querySelectorAll<HTMLElement>("button, input, select, textarea") ?? [])].filter(
        (item) => !item.hasAttribute("disabled"),
      )
    const frame = window.requestAnimationFrame(() => {
      const preferred =
        node?.querySelector<HTMLElement>("[data-initial-focus], [autofocus], input, textarea, select")
      ;(preferred ?? getItems()[0])?.focus()
    })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current()
      if (event.key !== "Tab" || !node) return
      const items = getItems()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener("keydown", onKey)
      previous?.focus()
    }
  }, [])
  return ref
}
