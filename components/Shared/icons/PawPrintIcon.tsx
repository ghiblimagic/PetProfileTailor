/**
 * Font Awesome paw icon for list bullets.
 * Notes: docs/notes/components/reusable-small-components.md
 */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";

export default function PawPrintIcon() {
  return <FontAwesomeIcon icon={faPaw} className="yellow mr-2" />;
}
