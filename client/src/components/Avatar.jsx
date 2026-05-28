const COLORS = [
  ['#4f8ef7', '#7c5cfc'],
  ['#22d3a0', '#4f8ef7'],
  ['#f5a623', '#f25c5c'],
  ['#e85c9f', '#7c5cfc'],
  ['#7c5cfc', '#4f8ef7'],
];

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getGradient(name = '') {
  const idx = name.charCodeAt(0) % COLORS.length;
  return `linear-gradient(135deg, ${COLORS[idx][0]}, ${COLORS[idx][1]})`;
}

export default function Avatar({ name, src, size = 32, className = '' }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    fontSize: size * 0.38,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    background: src ? 'transparent' : getGradient(name || '?'),
    overflow: 'hidden',
  };

  if (src) {
    return <img src={src} alt={name} style={style} className={className} />;
  }

  return (
    <div style={style} className={className} title={name}>
      {getInitials(name || '?')}
    </div>
  );
}