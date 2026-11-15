import Icon from './Icon';
export default function Stars({ value = 0, count }) {
  return (
    <span className="stars" title={`${value} out of 5`}>
      <Icon name="star" size={15} /> <b>{value ? value.toFixed(1) : 'New'}</b>
      {count !== undefined && <span className="muted small"> ({count})</span>}
    </span>
  );
}
