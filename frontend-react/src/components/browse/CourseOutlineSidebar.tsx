import { useEffect, useState } from "react";
import { NavLink, useMatch } from "react-router-dom";
import { Accordion, AccordionTab } from "primereact/accordion";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { useCourseOutline } from "@/hooks/useCourseOutline";
import { taskTypeLabelRu } from "@/lib/task-type-labels";

type Props = {
  courseId: string;
};

export function CourseOutlineSidebar({ courseId }: Props) {
  const { data, loading, error } = useCourseOutline(courseId);
  const [openModules, setOpenModules] = useState<number[]>([]);

  const modMatch = useMatch("/courses/:courseId/modules/:moduleId/*");
  const activeModuleId = modMatch?.params.moduleId;
  const lesMatch = useMatch("/courses/:courseId/modules/:moduleId/lessons/:lessonId/*");
  const activeLessonId = lesMatch?.params.lessonId;
  const taskMatch = useMatch(
    "/courses/:courseId/modules/:moduleId/lessons/:lessonId/tasks/:taskId"
  );
  const activeTaskId = taskMatch?.params.taskId;

  useEffect(() => {
    setOpenModules([]);
  }, [courseId]);

  useEffect(() => {
    if (data?.modules.length) {
      setOpenModules(data.modules.map((_, i) => i));
    }
  }, [data]);

  useEffect(() => {
    if (!data?.modules.length || !activeModuleId) return;
    const idx = data.modules.findIndex((m) => m.id === activeModuleId);
    if (idx < 0) return;
    setOpenModules((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  }, [data, activeModuleId]);

  return (
    <aside
      className="surface-card border-right-1 surface-border flex flex-column flex-shrink-0 overflow-hidden"
      style={{
        width: "min(20rem, 92vw)",
        minHeight: "100vh",
        borderRight: "1px solid var(--surface-border)",
      }}
    >
      <div className="p-3 border-bottom-1 surface-border">
        <NavLink
          to="/courses"
          className="text-xs text-color-secondary no-underline hover:text-primary block mb-2"
        >
          ← Все курсы
        </NavLink>
        <NavLink
          to={`/courses/${courseId}`}
          className="text-sm font-semibold text-color no-underline hover:text-primary"
        >
          {loading ? "…" : data?.courseTitle ?? "Курс"}
        </NavLink>
        <div className="text-xs text-color-secondary mt-1 line-height-3">Содержание</div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex justify-content-center py-4">
            <ProgressSpinner style={{ width: 36, height: 36 }} strokeWidth="4" />
          </div>
        )}
        {error && <Message severity="warn" text={error} className="w-full text-sm" />}
        {!loading && !error && data && data.modules.length === 0 && (
          <p className="text-sm text-color-secondary m-0 px-2">В курсе пока нет модулей.</p>
        )}
        {!loading && !error && data && data.modules.length > 0 && (
          <Accordion
            multiple
            activeIndex={openModules}
            onTabChange={(e) => {
              const idx = e.index;
              setOpenModules(Array.isArray(idx) ? [...idx] : [idx]);
            }}
            className="outline-accordion border-none shadow-none"
          >
            {data.modules.map((mod) => (
              <AccordionTab
                key={mod.id}
                headerClassName="text-sm"
                header={
                  <span className="flex align-items-center gap-2">
                    <i
                      className="pi pi-folder text-sm"
                      style={{
                        color:
                          mod.id === activeModuleId
                            ? "var(--primary-color)"
                            : "var(--text-color-secondary)",
                      }}
                      aria-hidden
                    />
                    <span className={mod.id === activeModuleId ? "font-semibold" : ""}>
                      {mod.title}
                    </span>
                  </span>
                }
              >
                <ul className="list-none m-0 p-0 pl-1 flex flex-column gap-1">
                  {mod.lessons.map((lesson) => {
                    const lessonPath = `/courses/${courseId}/modules/${mod.id}/lessons/${lesson.id}`;
                    const lessonActive =
                      lesson.id === activeLessonId && mod.id === activeModuleId && !activeTaskId;

                    return (
                      <li key={lesson.id}>
                        <NavLink
                          to={lessonPath}
                          className={[
                            "block py-2 px-2 border-round-md no-underline text-sm transition-colors transition-duration-150",
                            lessonActive
                              ? "font-semibold surface-ground border-left-3"
                              : "text-color hover:surface-hover",
                          ].join(" ")}
                          style={
                            lessonActive
                              ? { borderLeftColor: "var(--primary-color)", borderLeftWidth: 3 }
                              : undefined
                          }
                        >
                          <span className="flex align-items-start gap-2">
                            <i className="pi pi-file text-xs mt-1 text-color-secondary" aria-hidden />
                            <span>{lesson.title}</span>
                          </span>
                        </NavLink>
                        {lesson.tasks.length > 0 && (
                          <ul className="list-none m-0 mt-1 mb-2 pl-3 flex flex-column gap-0">
                            {lesson.tasks.map((t) => {
                              const taskPath = `${lessonPath}/tasks/${t.id}`;
                              const taskActive =
                                t.id === activeTaskId &&
                                lesson.id === activeLessonId &&
                                mod.id === activeModuleId;
                              return (
                                <li key={t.id}>
                                  <NavLink
                                    to={taskPath}
                                    className={[
                                      "block py-1 px-2 border-round-md no-underline text-sm transition-colors transition-duration-150",
                                      taskActive
                                        ? "font-semibold surface-ground border-left-3"
                                        : "text-color-secondary hover:surface-hover",
                                    ].join(" ")}
                                    style={
                                      taskActive
                                        ? {
                                            borderLeftColor: "var(--primary-color)",
                                            borderLeftWidth: 3,
                                          }
                                        : undefined
                                    }
                                  >
                                    <span className="flex align-items-center gap-2">
                                      <i
                                        className="pi pi-pencil text-xs text-color-secondary"
                                        aria-hidden
                                      />
                                      <span className="line-height-3">
                                        {taskTypeLabelRu(t.type)}
                                      </span>
                                    </span>
                                  </NavLink>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </AccordionTab>
            ))}
          </Accordion>
        )}
      </div>
    </aside>
  );
}
