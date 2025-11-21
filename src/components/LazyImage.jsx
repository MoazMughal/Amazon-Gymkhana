import { useState, useEffect, useRef, memo } from 'react';

const LazyImage = ({ src, alt, className, style, onClick }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageRef, setImageRef] = useState();
  const imgRef = useRef();

  useEffect(() => {
    let observer;
    
    if (imgRef.current && imageSrc !== src) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imgRef.current);
            }
          });
        },
        {
          rootMargin: '50px' // Start loading 50px before image is visible
        }
      );
      
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (observer && observer.unobserve && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, imageSrc]);

  return (
    <img
      ref={imgRef}
      src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E'}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      loading="lazy"
    />
  );
};

export default memo(LazyImage);
