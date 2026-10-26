import type { ModuleDef } from "../../layout/registry";
import { send, usePlayer } from "../../state/player";
import type { QueueItem } from "../../state/reducer";
import { Art } from "../../ui/Art";
import { Empty } from "../../ui/Empty";
import { Icon } from "../../ui/icons";

function QueueRow({ item, active }: { item: QueueItem; active: boolean }) {
  return (
    <li
      className={active ? "row active" : "row"}
      onDoubleClick={() => send("nowplayinglistplay", item.position)}
      title="Double-click to play"
    >
      <Art name={item.title} className="thumb" />
      <span className="row-main">
        <span className="row-title">{item.title}</span>
        <span className="muted small">{item.artist}</span>
      </span>
      <button className="icon-button" aria-label="Remove from queue" onClick={() => send("nowplayinglistremove", item.position)}>
        <Icon name="close" size={14} />
      </button>
    </li>
  );
}

function Queue() {
  const queue = usePlayer((s) => s.queue);
  const current = usePlayer((s) => s.track?.path);
  if (!queue.items.length) return <Empty text="The queue is empty. Play an album or playlist to fill it." />;
  const at = queue.items.findIndex((item) => item.path === current);
  const rows = (items: QueueItem[]) => items.map((item) => (
    <QueueRow key={`${item.position}-${item.path}`} item={item} active={item.path === current} />
  ));
  return (
    <div className="queue">
      <h2 className="module-title">Queue</h2>
      {at > 0 && (
        <>
          <h3 className="section-title muted">Earlier</h3>
          <ol className="list">{rows(queue.items.slice(0, at))}</ol>
        </>
      )}
      {at >= 0 && (
        <>
          <h3 className="section-title">Now playing</h3>
          <ol className="list">{rows([queue.items[at]])}</ol>
        </>
      )}
      <h3 className="section-title">Next up</h3>
      <ol className="list">{rows(at >= 0 ? queue.items.slice(at + 1) : queue.items)}</ol>
    </div>
  );
}

export default { id: "queue", title: "Queue", component: Queue } satisfies ModuleDef;
