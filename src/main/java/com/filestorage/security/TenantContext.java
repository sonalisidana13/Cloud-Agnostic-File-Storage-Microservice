package com.filestorage.security;

import com.filestorage.model.Tenant;

public final class TenantContext {

    private static final ThreadLocal<Tenant> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static Tenant get() {
        return CURRENT_TENANT.get();
    }

    public static void set(Tenant tenant) {
        CURRENT_TENANT.set(tenant);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
