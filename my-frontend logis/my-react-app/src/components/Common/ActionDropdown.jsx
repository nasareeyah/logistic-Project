import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * ActionDropdown
 * Shared Floating Action Dropdown rendered via React Portal into document.body.
 * Ensures that the dropdown menu floats completely above table layers and does not
 * alter table dimensions, cause layout shifts, or trigger container scrollbars.
 *
 * @param {Array} items - Array of { label, icon, onClick, danger, className }
 * @param {ReactNode} trigger - Optional custom trigger button content
 * @param {string} title - Button tooltip title (default: "Actions")
 * @param {Function} children - Optional custom render prop or children: ({ close }) => ReactNode
 * @param {string} className - Additional CSS class for trigger wrapper
 */
export default function ActionDropdown({
  items = [],
  menuItems = [],
  trigger,
  title = "Actions",
  children,
  className = "",
  align = "right"
}) {
  const effectiveItems = Array.isArray(items) && items.length > 0 ? items : (Array.isArray(menuItems) ? menuItems : []);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpward: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = menuEl ? menuEl.offsetWidth : 170;
    const menuHeight = menuEl ? menuEl.offsetHeight : 95;

    // Horizontal positioning: align right edge by default
    let left = rect.right - menuWidth;
    if (align === "left") {
      left = rect.left;
    }

    // Boundary check for horizontal viewport
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    // Vertical positioning: auto-flip if close to viewport bottom
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12;
    let top = openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4;

    setCoords({ top, left, openUpward });
  }, [align]);

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      // Calculate initial coordinates immediately before render
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < 110 && rect.top > 110;
        setCoords({
          top: openUpward ? rect.top - 100 : rect.bottom + 4,
          left: Math.max(10, rect.right - 170),
          openUpward
        });
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Recalculate accurately once menu element is mounted/measured
  useLayoutEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  // Handle outside clicks, ESC key, and scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return;
      }
      handleClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleScrollOrResize = (e) => {
      // If event happened inside the menu, ignore
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return;
      }
      if (!triggerRef.current) {
        handleClose();
        return;
      }
      const rect = triggerRef.current.getBoundingClientRect();
      // If button is scrolled out of viewport, close menu
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        handleClose();
      } else {
        calculatePosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, handleClose, calculatePosition]);

  return (
    <div className={`action-menu-container ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`action-dots-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        title={title}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger || <MoreVertical size={18} />}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`action-dropdown-menu portal-action-menu ${
              coords.openUpward ? 'open-upward' : 'open-downward'
            }`}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {typeof children === 'function' ? (
              children({ close: handleClose })
            ) : children ? (
              children
            ) : (
              effectiveItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`dropdown-item ${item.danger ? 'delete-item' : ''} ${
                    item.className || ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                    if (item.onClick) item.onClick(e);
                  }}
                >
                  {item.icon}
                  <span className={item.danger ? 'danger-text' : ''}>
                    {item.label}
                  </span>
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
