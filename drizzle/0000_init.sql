CREATE TYPE "public"."consumer_status" AS ENUM('pending_access', 'active', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."ledger_direction" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('top_up', 'purchase_debit', 'merchant_credit', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."ledger_ref_type" AS ENUM('top_up', 'order', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."merchant_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."merchant_user_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'redeemed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."top_up_status" AS ENUM('created', 'pending', 'processing', 'confirmed', 'failed', 'expired', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."wallet_status" AS ENUM('created', 'active', 'blocked', 'closed');--> statement-breakpoint
CREATE TABLE "consumers" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"cpf" text,
	"phone" text,
	"status" "consumer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "event_status" DEFAULT 'active' NOT NULL,
	"location" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"wallet_id" text,
	"merchant_id" text,
	"entry_type" "ledger_entry_type" NOT NULL,
	"direction" "ledger_direction" NOT NULL,
	"amount_cents" integer NOT NULL,
	"balance_after_cents" integer,
	"reference_type" "ledger_ref_type" NOT NULL,
	"reference_id" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_users" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "merchant_user_role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"description" text,
	"status" "merchant_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"name_snapshot" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"line_total_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"consumer_id" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_cents" integer NOT NULL,
	"qr_token" text NOT NULL,
	"note" text,
	"validated_by_user_id" text,
	"redeemed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"image_url" text,
	"category" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "top_ups" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "top_up_status" DEFAULT 'pending' NOT NULL,
	"customer_name" text,
	"customer_document" text,
	"provider" text DEFAULT 'confrapix' NOT NULL,
	"provider_transaction_id" text,
	"provider_uuid" text,
	"txid" text,
	"pix_qr_code" text,
	"pix_copy_paste_code" text,
	"expires_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"consumer_id" text NOT NULL,
	"event_id" text NOT NULL,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	"reserved_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"status" "wallet_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_users" ADD CONSTRAINT "merchant_users_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_consumer_id_consumers_id_fk" FOREIGN KEY ("consumer_id") REFERENCES "public"."consumers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_validated_by_user_id_merchant_users_id_fk" FOREIGN KEY ("validated_by_user_id") REFERENCES "public"."merchant_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_consumer_id_consumers_id_fk" FOREIGN KEY ("consumer_id") REFERENCES "public"."consumers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "consumers_email_uq" ON "consumers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ledger_wallet_idx" ON "ledger_entries" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "ledger_merchant_idx" ON "ledger_entries" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_idempotency_uq" ON "ledger_entries" USING btree ("reference_type","reference_id","entry_type");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_users_email_uq" ON "merchant_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "merchant_users_merchant_idx" ON "merchant_users" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "merchants_event_idx" ON "merchants" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_qr_token_uq" ON "orders" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "orders_wallet_idx" ON "orders" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "orders_merchant_idx" ON "orders" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_merchant_idx" ON "products" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "top_ups_wallet_idx" ON "top_ups" USING btree ("wallet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "top_ups_provider_uuid_uq" ON "top_ups" USING btree ("provider_uuid");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_consumer_event_uq" ON "wallets" USING btree ("consumer_id","event_id");