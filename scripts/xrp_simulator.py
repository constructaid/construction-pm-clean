#!/usr/bin/env python3
"""
XRP Ledger Payment Simulator
Simulates construction payment workflows using XRPL testnet
Standalone script for offline testing and demonstration

Requirements:
    pip install xrpl-py requests

Usage:
    python scripts/xrp_simulator.py
"""

import time
import json
from datetime import datetime
from xrpl.clients import JsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models.transactions import Payment, EscrowCreate
from xrpl.utils import xrp_to_drops, drops_to_xrp
from xrpl.transaction import submit_and_wait
from xrpl.account import get_balance

# XRPL Testnet Configuration
TESTNET_URL = "https://s.altnet.rippletest.net:51234"

class XRPConstructionSimulator:
    """
    Simulates construction payment workflows on XRP Ledger
    """

    def __init__(self):
        self.client = JsonRpcClient(TESTNET_URL)
        print(f"🔗 Connected to XRPL Testnet: {TESTNET_URL}")

    def create_wallet(self, label="Project Wallet"):
        """Create a new XRPL wallet"""
        wallet = Wallet.create()
        print(f"\n✅ Created {label}")
        print(f"   Address: {wallet.classic_address}")
        print(f"   Seed: {wallet.seed}")
        print(f"   ⚠️  SAVE THIS SEED - IT WILL NOT BE SHOWN AGAIN")
        return wallet

    def fund_wallet(self, wallet):
        """Fund wallet from testnet faucet"""
        print(f"\n💰 Funding wallet {wallet.classic_address}...")

        # Request testnet XRP from faucet
        from xrpl.wallet import generate_faucet_wallet
        try:
            # Note: generate_faucet_wallet creates AND funds a wallet
            # For existing wallet, we'll use the faucet API directly
            import requests
            response = requests.post(
                "https://faucet.altnet.rippletest.net/accounts",
                json={"destination": wallet.classic_address}
            )

            if response.status_code == 200:
                time.sleep(4)  # Wait for ledger update
                balance = get_balance(wallet.classic_address, self.client)
                print(f"   ✅ Funded! Balance: {drops_to_xrp(balance)} XRP")
                return True
            else:
                print(f"   ❌ Faucet request failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Funding failed: {e}")
            return False

    def get_balance(self, wallet):
        """Get wallet balance"""
        balance_drops = get_balance(wallet.classic_address, self.client)
        balance_xrp = drops_to_xrp(balance_drops)
        print(f"💵 Balance for {wallet.classic_address}: {balance_xrp} XRP")
        return balance_xrp

    def send_payment(self, from_wallet, to_address, amount_xrp, memo=""):
        """Send XRP payment"""
        print(f"\n📤 Sending {amount_xrp} XRP...")
        print(f"   From: {from_wallet.classic_address}")
        print(f"   To: {to_address}")

        # Build payment transaction
        payment_tx = Payment(
            account=from_wallet.classic_address,
            destination=to_address,
            amount=xrp_to_drops(amount_xrp),
        )

        # Add memo if provided
        if memo:
            memo_data = memo.encode('utf-8').hex()
            memo_type = "construction-payment".encode('utf-8').hex()
            payment_tx.memos = [{
                "Memo": {
                    "MemoData": memo_data,
                    "MemoType": memo_type
                }
            }]

        # Submit transaction
        try:
            response = submit_and_wait(payment_tx, self.client, from_wallet)

            if response.result.get('meta', {}).get('TransactionResult') == 'tesSUCCESS':
                tx_hash = response.result['hash']
                print(f"   ✅ Payment successful!")
                print(f"   Hash: {tx_hash}")
                print(f"   Validated: {response.result.get('validated', False)}")

                # Show new balance
                self.get_balance(from_wallet)
                return tx_hash
            else:
                print(f"   ❌ Payment failed: {response.result}")
                return None
        except Exception as e:
            print(f"   ❌ Payment error: {e}")
            return None

    def create_escrow(self, from_wallet, to_address, amount_xrp, days_until_release=7, memo=""):
        """Create time-locked escrow for milestone payments"""
        print(f"\n🔒 Creating escrow for {amount_xrp} XRP...")
        print(f"   From: {from_wallet.classic_address}")
        print(f"   To: {to_address}")
        print(f"   Release after: {days_until_release} days")

        # Calculate timestamps (Ripple epoch: Jan 1, 2000)
        import time as time_module
        RIPPLE_EPOCH = 946684800
        current_time = int(time_module.time())
        finish_after = current_time + (days_until_release * 24 * 60 * 60) - RIPPLE_EPOCH

        # Build escrow transaction
        escrow_tx = EscrowCreate(
            account=from_wallet.classic_address,
            destination=to_address,
            amount=xrp_to_drops(amount_xrp),
            finish_after=finish_after,
        )

        # Add memo
        if memo:
            memo_data = memo.encode('utf-8').hex()
            memo_type = "construction-escrow".encode('utf-8').hex()
            escrow_tx.memos = [{
                "Memo": {
                    "MemoData": memo_data,
                    "MemoType": memo_type
                }
            }]

        # Submit transaction
        try:
            response = submit_and_wait(escrow_tx, self.client, from_wallet)

            if response.result.get('meta', {}).get('TransactionResult') == 'tesSUCCESS':
                tx_hash = response.result['hash']
                print(f"   ✅ Escrow created!")
                print(f"   Hash: {tx_hash}")
                print(f"   Funds locked until: {datetime.fromtimestamp(finish_after + RIPPLE_EPOCH)}")
                return tx_hash
            else:
                print(f"   ❌ Escrow creation failed: {response.result}")
                return None
        except Exception as e:
            print(f"   ❌ Escrow error: {e}")
            return None

    def simulate_construction_payment_flow(self):
        """
        Simulate a complete construction payment workflow:
        1. Owner funds escrow for GC
        2. GC pays subcontractor upon milestone
        """
        print("\n" + "="*60)
        print("🏗️  CONSTRUCTION PAYMENT FLOW SIMULATION")
        print("="*60)

        # Step 1: Create wallets
        print("\n📋 Step 1: Creating Project Wallets")
        owner_wallet = self.create_wallet("Owner Wallet")
        gc_wallet = self.create_wallet("General Contractor Wallet")
        sub_wallet = self.create_wallet("Subcontractor Wallet")

        # Step 2: Fund owner wallet
        print("\n📋 Step 2: Funding Owner Wallet from Testnet Faucet")
        if not self.fund_wallet(owner_wallet):
            print("❌ Simulation failed - could not fund owner wallet")
            return

        # Step 3: Owner creates escrow for GC (foundation milestone)
        print("\n📋 Step 3: Owner Creates Escrow for GC (Foundation Milestone)")
        escrow_amount = 50  # 50 XRP (~$100 if 1 XRP = $2)
        escrow_hash = self.create_escrow(
            owner_wallet,
            gc_wallet.classic_address,
            escrow_amount,
            days_until_release=7,
            memo="Project #2025-001: Foundation Complete - $100,000 USD"
        )

        if not escrow_hash:
            print("❌ Simulation failed - could not create escrow")
            return

        # Step 4: Owner directly pays GC (immediate payment scenario)
        print("\n📋 Step 4: Owner Pays GC (Direct Payment - No Escrow)")
        gc_payment = 25  # 25 XRP
        gc_payment_hash = self.send_payment(
            owner_wallet,
            gc_wallet.classic_address,
            gc_payment,
            memo="Project #2025-001: Progress Payment #1"
        )

        time.sleep(2)  # Wait for ledger

        # Step 5: GC pays subcontractor
        print("\n📋 Step 5: GC Pays Subcontractor")
        sub_payment = 10  # 10 XRP
        sub_payment_hash = self.send_payment(
            gc_wallet,
            sub_wallet.classic_address,
            sub_payment,
            memo="Project #2025-001: Concrete Work - Division 03"
        )

        # Final balances
        print("\n" + "="*60)
        print("💰 FINAL BALANCES")
        print("="*60)
        self.get_balance(owner_wallet)
        self.get_balance(gc_wallet)
        self.get_balance(sub_wallet)

        # Summary
        print("\n" + "="*60)
        print("✅ SIMULATION COMPLETE")
        print("="*60)
        print("\n📊 Transaction Summary:")
        print(f"   Escrow Created: {escrow_hash}")
        print(f"   GC Payment: {gc_payment_hash}")
        print(f"   Subcontractor Payment: {sub_payment_hash}")
        print("\n🔍 View transactions on XRPL Testnet Explorer:")
        print(f"   https://testnet.xrpl.org/")

        # Save wallet info
        wallet_data = {
            "owner": {
                "address": owner_wallet.classic_address,
                "seed": owner_wallet.seed
            },
            "gc": {
                "address": gc_wallet.classic_address,
                "seed": gc_wallet.seed
            },
            "subcontractor": {
                "address": sub_wallet.classic_address,
                "seed": sub_wallet.seed
            }
        }

        with open('simulation_wallets.json', 'w') as f:
            json.dump(wallet_data, f, indent=2)

        print("\n💾 Wallet data saved to: simulation_wallets.json")
        print("   ⚠️  KEEP THIS FILE SECURE - Contains wallet seeds!")

def main():
    """Run simulation"""
    simulator = XRPConstructionSimulator()
    simulator.simulate_construction_payment_flow()

if __name__ == "__main__":
    main()
