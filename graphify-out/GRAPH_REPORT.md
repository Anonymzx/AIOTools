# Graph Report - AIOTools  (2026-10-04)

## Corpus Check
- 96 files · ~79,978 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 51 file(s) not represented in the graph (top: .csv 51)

## Summary
- 1017 nodes · 1498 edges · 88 communities (39 shown, 49 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Brand Context Injection
- Generic Token Schema
- CIP Search Engine
- shadcn Color Palette
- Component Style Tokens
- Slide Search CLI
- Token Type System
- Design Search Core
- HTML Token Validator
- Tailwind Config Tests
- Brand Banner System
- Design Doc Formatters
- Slide Generator Scripts
- Tailwind Generator Core
- Search Core Tests
- CIP Design Knowledge
- Background Image Fetcher
- Slide Presentation System
- Dark Mode Resolver
- CIP Image Generator
- Icon Generator
- Design Reasoning Engine
- Palette Search Ranker
- Token Value Primitives
- shadcn Installer Tests
- Logo Generator
- Color Extractor CLI
- Asset Validator CLI
- Design System Search
- HTML Embed Renderer
- shadcn Installer Core
- Animation Duration Tokens
- Luminance Dark Detector
- CIP Search CLI
- Slide Token Validation
- JS Config Sanitizer
- Logo Search Brief
- Border Radius Tokens
- Hardcoded Color Tests
- Data Integrity Guard
- Shadow Tokens
- Size Scale Tokens
- Starter Token Bundle
- Default Theme Tokens
- Medium Scale Tokens
- Null Token Values
- Agent Operating Protocol
- Pitch Framework Link
- Asset Naming Convention
- Screenshot Export Workflow
- Brand Package Workflow
- AIDA Formula
- FAB Formula
- Dark Mode Setup
- UI Python Dependencies
- UI Test Dependencies
- UX Pro Max Skill

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `TestTailwindConfigGenerator` - 35 edges
3. `ShadcnInstaller` - 34 edges
4. `TestShadcnInstaller` - 26 edges
5. `DesignSystemGenerator` - 21 edges
6. `color` - 15 edges
7. `Brand Skill` - 13 edges
8. `search_with_context()` - 12 edges
9. `gray` - 12 edges
10. `spacing` - 12 edges

## Surprising Connections (you probably didn't know these)
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .opencode/skills/ui-styling/scripts/tests/test_shadcn_add.py → .opencode/skills/ui-styling/scripts/shadcn_add.py
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .opencode/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .opencode/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .opencode/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .opencode/skills/ui-styling/scripts/tailwind_config_gen.py
- `Slide Generation System` --conceptually_related_to--> `Banner Design System`  [INFERRED]
  .opencode/skills/design-system/SKILL.md → .opencode/skills/banner-design/SKILL.md
- `Brand Guidelines Starter Template` --semantically_similar_to--> `Brand Guideline Template`  [INFERRED] [semantically similar]
  .opencode/skills/brand/templates/brand-guidelines-starter.md → .opencode/skills/brand/references/brand-guideline-template.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three-Layer Token System** — opencode_skills_design_system_references_primitive_tokens_primitive_tokens, opencode_skills_design_system_references_semantic_tokens_semantic_tokens, opencode_skills_design_system_references_component_tokens_component_tokens, opencode_skills_design_system_references_token_architecture_three_layer_token_architecture [EXTRACTED 0.95]
- **Brand Identity Triad** — opencode_skills_brand_references_visual_identity_visual_identity, opencode_skills_brand_references_voice_framework_brand_voice_framework, opencode_skills_brand_references_messaging_framework_messaging_framework [EXTRACTED 0.90]
- **Brand to Banner Compliance Flow** — opencode_skills_brand_skill_brand_skill, opencode_skills_banner_design_skill_banner_design_system, opencode_skills_brand_references_approval_checklist_asset_approval_checklist [INFERRED 0.75]
- **Slides knowledge base cluster** — opencode_skills_design_references_slides_slides_reference, opencode_skills_design_references_slides_create_creation_workflow, opencode_skills_design_references_slides_layout_patterns_layout_patterns, opencode_skills_design_references_slides_html_template_html_slide_template, opencode_skills_design_references_slides_copywriting_formulas_copywriting_formulas, opencode_skills_design_references_slides_strategies_deck_strategies [EXTRACTED 1.00]
- **Logo knowledge cluster** — opencode_skills_design_references_logo_design_logo_design_reference, opencode_skills_design_references_logo_style_guide_core_logo_types, opencode_skills_design_references_logo_color_psychology_color_psychology, opencode_skills_design_references_logo_prompt_engineering_prompt_engineering [EXTRACTED 1.00]
- **Complete brand package flow** — opencode_skills_design_references_logo_design_logo_design_reference, opencode_skills_design_references_cip_design_cip_design_reference, opencode_skills_design_references_slides_slides_reference [INFERRED 0.75]
- **Strategic HTML presentation creation system** — opencode_skills_slides_skill_slides_skill, opencode_skills_slides_references_layout_patterns_layout_patterns, opencode_skills_slides_references_html_template_html_slide_template, opencode_skills_slides_references_slide_strategies_slide_strategies, opencode_skills_slides_references_copywriting_formulas_copywriting_formulas [INFERRED 0.85]
- **Accessible component theming and styling system** — opencode_skills_ui_styling_skill_ui_styling_skill, opencode_skills_ui_styling_references_shadcn_components_component_catalog, opencode_skills_ui_styling_references_shadcn_theming_theming_system, opencode_skills_ui_styling_references_shadcn_accessibility_accessibility_patterns, opencode_skills_ui_styling_references_tailwind_utilities_utility_reference [INFERRED 0.85]

## Communities (88 total, 49 thin omitted)

### Community 0 - "Brand Context Injection"
Cohesion: 0.05
Nodes (46): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+38 more)

### Community 1 - "Generic Token Schema"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 2 - "CIP Search Engine"
Cohesion: 0.06
Nodes (13): BM25, detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), BM25 (+5 more)

### Community 3 - "shadcn Color Palette"
Cohesion: 0.04
Nodes (46): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+38 more)

### Community 4 - "Component Style Tokens"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 5 - "Slide Search CLI"
Cohesion: 0.08
Nodes (17): format_context(), format_result(), main(), BM25, calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion() (+9 more)

### Community 6 - "Token Type System"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 7 - "Design Search Core"
Cohesion: 0.09
Nodes (11): BM25, detect_domain(), _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), _normalize(), search() (+3 more)

### Community 8 - "HTML Token Validator"
Cohesion: 0.11
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 10 - "Brand Banner System"
Cohesion: 0.10
Nodes (24): 22 Art Direction Styles, Banner Size Reference, Banner Design System, Asset Approval Checklist, Asset Organization System, Brand Guideline Template, Color Palette Management System, Brand Consistency Checklist (+16 more)

### Community 11 - "Design Doc Formatters"
Cohesion: 0.11
Nodes (10): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), persist_design_system() (+2 more)

### Community 12 - "Slide Generator Scripts"
Cohesion: 0.13
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 14 - "Search Core Tests"
Cohesion: 0.10
Nodes (3): TestDomainDetection, TestSearchDomains, TestTokenizer

### Community 15 - "CIP Design Knowledge"
Cohesion: 0.12
Nodes (19): 22 Art Direction Styles, Banner Sizes and Art Direction Styles, CIP Deliverable Guide, CIP Design Reference, CIP Mockup Prompt Structure, CIP Design Style Guide, Design Routing Guide, Icon Design Reference (+11 more)

### Community 16 - "Background Image Fetcher"
Cohesion: 0.15
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 17 - "Slide Presentation System"
Cohesion: 0.12
Nodes (17): Copywriting Formulas, Create Subcommand, Chart.js Integration, HTML Slide Template, Layout Patterns, Slide Strategies, Slides Skill, Canvas Design System (+9 more)

### Community 18 - "Dark Mode Resolver"
Cohesion: 0.15
Nodes (6): _filter_anti_patterns_for_mode(), _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestAntiPatternGating, TestModeResolution

### Community 19 - "CIP Image Generator"
Cohesion: 0.18
Nodes (7): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main()

### Community 20 - "Icon Generator"
Cohesion: 0.18
Nodes (8): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main()

### Community 21 - "Design Reasoning Engine"
Cohesion: 0.17
Nodes (3): DesignSystemGenerator, TestReasoningMatch, TestEndToEndCoherence

### Community 22 - "Palette Search Ranker"
Cohesion: 0.14
Nodes (3): _resolve_dial(), _select_palette_for_mode(), TestPaletteSelection

### Community 23 - "Token Value Primitives"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 25 - "Logo Generator"
Cohesion: 0.19
Nodes (5): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main()

### Community 27 - "Color Extractor CLI"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 28 - "Asset Validator CLI"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 29 - "Design System Search"
Cohesion: 0.17
Nodes (4): format_markdown(), generate_design_system(), format_output(), TestPersistence

### Community 30 - "HTML Embed Renderer"
Cohesion: 0.21
Nodes (4): generate_html(), get_deliverable_info(), get_image_base64(), main()

### Community 35 - "Animation Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 36 - "Luminance Dark Detector"
Cohesion: 0.27
Nodes (3): _palette_is_dark(), _relative_luminance(), TestLuminance

### Community 37 - "CIP Search CLI"
Cohesion: 0.28
Nodes (3): format_brief(), format_results(), main()

### Community 42 - "Border Radius Tokens"
Cohesion: 0.29
Nodes (8): xl, $type, $value, radius, full, xl, $type, $value

### Community 43 - "Hardcoded Color Tests"
Cohesion: 0.29
Nodes (3): _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 44 - "Data Integrity Guard"
Cohesion: 0.47
Nodes (3): _check_file(), main(), _read_rows()

### Community 45 - "Shadow Tokens"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 46 - "Size Scale Tokens"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 47 - "Starter Token Bundle"
Cohesion: 0.50
Nodes (3): dark, primitive, $schema

### Community 48 - "Default Theme Tokens"
Cohesion: 0.67
Nodes (4): $type, $value, default, default

### Community 49 - "Medium Scale Tokens"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 50 - "Null Token Values"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

## Ambiguous Edges - Review These
- `Icon Design Reference` → `Core Logo Types and Aesthetic Styles`  [AMBIGUOUS]
  .opencode/skills/design/references/icon-design.md · relation: conceptually_related_to
- `Chart.js Integration` → `shadcn Component Catalog`  [AMBIGUOUS]
  .opencode/skills/slides/references/html-template.md · relation: conceptually_related_to

## Knowledge Gaps
- **149 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+144 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 447 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Icon Design Reference` and `Core Logo Types and Aesthetic Styles`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Chart.js Integration` and `shadcn Component Catalog`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `TailwindConfigGenerator` connect `Tailwind Generator Core` to `Tailwind Config Tests`, `Regression Test Suite`, `Config File Generator`, `Config Path Resolver`, `Slide Token Validation`, `JS Config Sanitizer`, `Color Palette Add Tests`, `Custom Font Tests`, `Custom Spacing Tests`, `Plugin Recommend Tests`, `Next.js Plugin Tests`, `TypeScript Config Tests`, `Default Init Tests`, `Valid Config Tests`, `Missing Paths Tests`, `JavaScript Init Tests`, `Write Content Tests`, `Framework Init Tests`, `Full JS Config Tests`, `TS Output Path Tests`, `Custom Path Tests`, `Custom Color Tests`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `ShadcnInstaller` connect `shadcn Installer Core` to `Dry Run Add Tests`, `List Empty Config Tests`, `Component Add Tests`, `Installer Initializer`, `Overwrite Flag Tests`, `shadcn Installer Tests`, `Dry Run All Tests`, `Regression Test Suite`, `List Installed Tests`, `Get Empty Components Tests`, `Get Existing Components Tests`, `Empty List Guard Tests`, `shadcn Component Manager`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `primitive` connect `Starter Token Bundle` to `Generic Token Schema`, `Animation Duration Tokens`, `Token Type System`, `Border Radius Tokens`, `Shadow Tokens`, `Token Value Primitives`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _149 weakly-connected nodes found - possible documentation gaps or missing edges._