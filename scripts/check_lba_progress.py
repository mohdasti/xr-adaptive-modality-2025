#!/usr/bin/env python3
"""
Check LBA analysis progress and diagnostics
Shows draw counts, divergences, and convergence metrics
"""

import sys
from pathlib import Path

try:
    import arviz as az
    import numpy as np
except ImportError:
    print("Error: arviz not installed. Install with: pip install arviz")
    sys.exit(1)

def check_progress():
    """Check analysis progress and diagnostics"""
    
    trace_file = Path("analysis/results/lba_trace.nc")
    
    if not trace_file.exists():
        print("="*60)
        print("LBA Analysis Progress Check")
        print("="*60)
        print("\n⚠ No trace file found yet.")
        print("   The analysis is still in warmup/tuning phase.")
        print("   PyMC creates the trace file after warmup completes.")
        print("\nTo check if process is running:")
        print("   ps aux | grep lba.py | grep -v grep")
        return
    
    print("="*60)
    print("LBA Analysis Progress")
    print("="*60)
    
    try:
        # Load trace
        trace = az.from_netcdf(str(trace_file))
        
        # Get posterior (sampling phase)
        if hasattr(trace, 'posterior') and len(trace.posterior.dims) > 0:
            posterior = trace.posterior
            n_chains = posterior.dims.get('chain', 0)
            n_draws = posterior.dims.get('draw', 0)
            
            print(f"\n✓ Trace file found: {trace_file}")
            print(f"  File size: {trace_file.stat().st_size / (1024**2):.1f} MB")
            print(f"\nSampling Progress:")
            print(f"  Chains: {n_chains}")
            print(f"  Draws per chain: {n_draws}")
            print(f"  Total samples: {n_chains * n_draws}")
            
            # Expected: 1000 draws per chain
            if n_draws > 0:
                progress_pct = (n_draws / 1000) * 100
                print(f"  Progress: {progress_pct:.1f}% ({n_draws}/1000 draws per chain)")
            
            # Check warmup phase
            if hasattr(trace, 'warmup_posterior'):
                warmup = trace.warmup_posterior
                warmup_draws = warmup.dims.get('draw', 0)
                print(f"\nWarmup Phase:")
                print(f"  Warmup draws per chain: {warmup_draws}")
                if warmup_draws < 2000:
                    warmup_pct = (warmup_draws / 2000) * 100
                    print(f"  Warmup progress: {warmup_pct:.1f}% ({warmup_draws}/2000)")
                else:
                    print(f"  ✓ Warmup complete ({warmup_draws} draws)")
        else:
            print("\n⚠ Trace file exists but appears empty or incomplete")
            return
        
        # Check for divergences
        print(f"\n" + "="*60)
        print("Convergence Diagnostics")
        print("="*60)
        
        try:
            # Get sample stats
            sample_stats = trace.sample_stats if hasattr(trace, 'sample_stats') else None
            
            if sample_stats is not None and 'diverging' in sample_stats:
                divergences = sample_stats['diverging'].values
                total_divergences = int(np.sum(divergences))
                total_samples = divergences.size
                div_pct = (total_divergences / total_samples * 100) if total_samples > 0 else 0
                
                print(f"\nDivergences:")
                print(f"  Total divergences: {total_divergences}")
                print(f"  Total samples: {total_samples}")
                print(f"  Percentage: {div_pct:.2f}%")
                
                # Divergence thresholds
                if total_divergences == 0:
                    print(f"  ✓ No divergences - excellent!")
                elif div_pct < 1.0:
                    print(f"  ✓ Low divergence rate (<1%) - acceptable")
                elif div_pct < 5.0:
                    print(f"  ⚠ Moderate divergence rate (1-5%) - may need attention")
                    print(f"     Consider: reducing target_accept, reparameterizing model")
                else:
                    print(f"  ✗ High divergence rate (>5%) - convergence issues likely")
                    print(f"     Action needed: reparameterize model or adjust sampling")
                
                # Per-chain divergence counts
                if len(divergences.shape) > 1:
                    print(f"\n  Divergences per chain:")
                    for chain_idx in range(divergences.shape[0]):
                        chain_divs = int(np.sum(divergences[chain_idx]))
                        chain_total = divergences.shape[1] if len(divergences.shape) > 1 else 1
                        print(f"    Chain {chain_idx}: {chain_divs}/{chain_total} ({chain_divs/chain_total*100:.2f}%)")
            else:
                print("\n⚠ Divergence information not available in trace")
                print("   (This is normal if still in warmup phase)")
        
        except Exception as e:
            print(f"\n⚠ Could not extract divergence info: {e}")
        
        # Check R-hat if we have enough samples
        if n_draws >= 100:
            print(f"\nR-hat (Gelman-Rubin diagnostic):")
            try:
                # Get a few key parameters to check
                var_names = ['vc_slope_mu', 'gap_slope_mu', 't0_mu', 've_mu']
                available_vars = [v for v in var_names if v in trace.posterior.data_vars]
                
                if available_vars:
                    rhat = az.rhat(trace, var_names=available_vars)
                    for var_name in available_vars:
                        try:
                            rhat_val = float(rhat[var_name].values)
                            status = "✓" if rhat_val < 1.01 else "⚠" if rhat_val < 1.05 else "✗"
                            print(f"  {status} {var_name}: {rhat_val:.3f}")
                        except:
                            pass
                    
                    print(f"\n  R-hat < 1.01: excellent convergence")
                    print(f"  R-hat < 1.05: acceptable convergence")
                    print(f"  R-hat >= 1.05: convergence issues")
                else:
                    print("  (Key parameters not found in trace)")
            except Exception as e:
                print(f"  ⚠ Could not compute R-hat: {e}")
        else:
            print(f"\n⚠ Not enough samples for R-hat (need >=100, have {n_draws})")
        
        print(f"\n" + "="*60)
        print("Next Steps:")
        if n_draws < 1000:
            remaining = 1000 - n_draws
            print(f"  - Waiting for {remaining} more draws per chain")
        else:
            print(f"  - Sampling complete! Check for final output files:")
            print(f"    - analysis/results/lba_parameters.json")
            print(f"    - analysis/results/lba_parameters_summary.csv")
        print("="*60)
        
    except Exception as e:
        print(f"\n✗ Error reading trace file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_progress()
