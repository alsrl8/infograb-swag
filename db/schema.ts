import {sqliteTable,text,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const receipts=sqliteTable('receipts',{
 id:text('id').primaryKey(), product:text('product').notNull(), name:text('name').notNull(),
 device:text('device').notNull(), createdAt:text('created_at').notNull(),
},table=>[uniqueIndex('one_product_per_name').on(table.product,table.name)]);

export const passes = sqliteTable('passes', {
 name: text('name').primaryKey(),
 device: text('device').notNull(),
 createdAt: text('created_at').notNull(),
});
