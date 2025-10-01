import './GlassSurfaceSimple.css';

const GlassSurfaceSimple = ({ children, className = '', style = {} }) => {
  return (
    <div className={`glass-surface-simple ${className}`} style={style}>
      {children}
    </div>
  );
};

export default GlassSurfaceSimple;
