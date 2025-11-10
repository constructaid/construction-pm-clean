/**
 * CSI Searchable Select Component
 * Provides autocomplete search for CSI MasterFormat codes
 */
import { createSignal, createEffect, For, Show } from 'solid-js';
import { CSI_SECTIONS, type CSISection } from '../lib/data/csi-sections';

interface CSISearchableSelectProps {
  value?: string;
  onChange: (code: string, division: string, title: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  class?: string;
}

export default function CSISearchableSelect(props: CSISearchableSelectProps) {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedIndex, setSelectedIndex] = createSignal(-1);
  const [filteredResults, setFilteredResults] = createSignal<CSISection[]>([]);

  // Initialize search query with existing value if provided
  createEffect(() => {
    if (props.value) {
      const section = CSI_SECTIONS.find(s => s.code === props.value);
      if (section) {
        setSearchQuery(`${section.code} - ${section.title}`);
      }
    }
  });

  // Filter CSI sections based on search query
  createEffect(() => {
    const query = searchQuery().toLowerCase().trim();

    if (!query) {
      setFilteredResults([]);
      setIsOpen(false);
      return;
    }

    const results = CSI_SECTIONS.filter(section => {
      // Search by code
      if (section.code.includes(query)) return true;

      // Search by title
      if (section.title.toLowerCase().includes(query)) return true;

      // Search by keywords
      if (section.keywords.some(keyword => keyword.toLowerCase().includes(query))) return true;

      return false;
    }).slice(0, 50); // Limit to 50 results

    setFilteredResults(results);
    setIsOpen(results.length > 0);
    setSelectedIndex(-1);
  });

  const handleInput = (e: InputEvent) => {
    const value = (e.target as HTMLInputElement).value;
    setSearchQuery(value);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const results = filteredResults();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex() >= 0 && results[selectedIndex()]) {
        selectSection(results[selectedIndex()]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const selectSection = (section: CSISection) => {
    setSearchQuery(`${section.code} - ${section.title}`);
    setIsOpen(false);
    setSelectedIndex(-1);
    props.onChange(section.code, section.division, section.title);
  };

  const handleBlur = () => {
    // Delay to allow click events to fire
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div class="relative">
      <input
        type="text"
        id={props.id}
        value={searchQuery()}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => searchQuery() && setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={props.placeholder || "Type CSI code or search by work type (e.g., 'concrete', 'drywall', '03 30 00')..."}
        required={props.required}
        autocomplete="off"
        class={props.class || "w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-600"}
      />

      <Show when={isOpen() && filteredResults().length > 0}>
        <div class="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <For each={filteredResults()}>
            {(section, index) => (
              <button
                type="button"
                class={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                  index() === selectedIndex() ? 'bg-gray-700' : ''
                }`}
                onClick={() => selectSection(section)}
              >
                <div class="flex items-start gap-3">
                  <span class="text-green-400 font-mono text-sm font-semibold whitespace-nowrap">
                    {section.code}
                  </span>
                  <div class="flex-1 min-w-0">
                    <div class="text-white text-sm font-medium truncate">
                      {section.title}
                    </div>
                    <div class="text-gray-400 text-xs">
                      Division {section.division}
                    </div>
                  </div>
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
