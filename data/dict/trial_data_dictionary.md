# Trial Data Dictionary

Block-level TLX responses are exported to `block_data.csv` with the following columns:

| Field | Units / Values | Type | Notes |
|-------|----------------|------|-------|
| movement_time_ms | milliseconds | continuous | Movement time for successful trials |
| error | 0/1 | binary | 1 indicates any error (miss/slip/timeout) |
| timeout | 0/1 | binary | 1 if trial timed out |
| modality | hand \| gaze | categorical | Active modality |
| ui_mode | static \| adaptive | categorical | UI condition |
| index_of_difficulty_nominal | bits | numeric | Nominal Fitts ID |
| index_of_difficulty_effective | bits | numeric | Effective ID (optional, computed) |
| target_distance_A | pixels | numeric | Target distance amplitude |
| endpoint_x | pixels | numeric | Endpoint X coordinate |
| endpoint_y | pixels | numeric | Endpoint Y coordinate |
| target_center_x | pixels | numeric | Target center X coordinate |
| target_center_y | pixels | numeric | Target center Y coordinate |
| endpoint_error_px | pixels | numeric | Distance from target center |
| trial_number | integer | count | Global trial index |
| trial_in_block | integer | count | Trial count within current block |
| block_number | integer | count | Block sequence number |
| block_order | string | categorical | Block code (HaS/GaS/HaA/GaA) |
| screen_width | pixels | numeric | Screen width reported by browser |
| screen_height | pixels | numeric | Screen height |
| window_width | pixels | numeric | Browser window width |
| window_height | pixels | numeric | Browser window height |
| device_pixel_ratio | ratio | numeric | Device pixel ratio |
| zoom_level | percent | numeric | Browser zoom percentage |
| is_fullscreen | TRUE/FALSE | boolean | Fullscreen compliance |
| user_agent | string | text | Browser user agent |
| adaptation_triggered | 0/1 | binary | Trial flagged as adaptation trigger |
| submovement_count | count | integer | Number of velocity peaks detected during the movement. Proxy for intermittent control updates (Meyer et al., 1988) |

