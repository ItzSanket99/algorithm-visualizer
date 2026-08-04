package com.algotrace.engine.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class WorkspaceManager {

    private static final Path WORKSPACE =
            Path.of("workspace");

    private static final Path SOURCE_DIRECTORY =
            WORKSPACE.resolve("sources");

    private static final Path CLASS_DIRECTORY =
            WORKSPACE.resolve("classes");

    private WorkspaceManager() {
    }

    public static void initialize() throws IOException {

        Files.createDirectories(WORKSPACE);
        Files.createDirectories(SOURCE_DIRECTORY);
        Files.createDirectories(CLASS_DIRECTORY);
    }

    public static Path getWorkspaceDirectory() {
        return WORKSPACE;
    }

    public static Path getSourceDirectory() {
        return SOURCE_DIRECTORY;
    }

    public static Path getClassDirectory() {
        return CLASS_DIRECTORY;
    }

    public static Path getSourceFile(String className) {

        return SOURCE_DIRECTORY.resolve(className + ".java");

    }

}