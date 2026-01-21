#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://raw.githubusercontent.com/AlcyoneLabs/simple-logger/main/skill-forge"
SKILL_NAME="simple-logger-usage"

usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Install the ${SKILL_NAME} skill for OpenCode, Gemini CLI, Claude, and FactoryAI Droid.

Options:
  -g, --global    Install globally (user scope) [default]
  -l, --local     Install locally (.opencode/skills/, .gemini/skills/, etc.)
  -s, --self      Install from local filesystem (for testing/dev)
  -h, --help      Show this help message

Examples:
  curl -fsSL ${REPO_URL}/install.sh | bash
  ./install.sh --self --local
EOF
}

validate_env() {
  if [[ -z "${SKILL_NAME}" ]]; then
    echo "Critical Error: SKILL_NAME is unset." >&2
    exit 1
  fi
  if [[ "${SKILL_NAME}" == *"/"* ]] || [[ "${SKILL_NAME}" == *" "* ]]; then
    echo "Critical Error: SKILL_NAME contains illegal characters." >&2
    exit 1
  fi
}

main() {
  local install_type="global"
  local self_install=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -g|--global) install_type="global"; shift ;;
      -l|--local) install_type="local"; shift ;;
      -s|--self) self_install=true; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
  done

  validate_env

  echo "Installing ${SKILL_NAME} skill (${install_type})..."

  local src_dir
  if [[ "$self_install" == true ]]; then
    src_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "Using local source: ${src_dir}"
  else
    src_dir=$(mktemp -d)
    trap "rm -rf '$src_dir'" EXIT
    echo "Fetching skill from ${REPO_URL}..."
    mkdir -p "${src_dir}/skill/${SKILL_NAME}" "${src_dir}/command"
    curl -fsSL "${REPO_URL}/skill/${SKILL_NAME}/SKILL.md" -o "${src_dir}/skill/${SKILL_NAME}/SKILL.md"
    curl -fsSL "${REPO_URL}/skill/${SKILL_NAME}/references/usage/README.md" -o "${src_dir}/skill/${SKILL_NAME}/references/usage/README.md"
    curl -fsSL "${REPO_URL}/skill/${SKILL_NAME}/references/usage/api.md" -o "${src_dir}/skill/${SKILL_NAME}/references/usage/api.md"
    curl -fsSL "${REPO_URL}/skill/${SKILL_NAME}/references/usage/configuration.md" -o "${src_dir}/skill/${SKILL_NAME}/references/usage/configuration.md"
    curl -fsSL "${REPO_URL}/skill/${SKILL_NAME}/references/usage/patterns.md" -o "${src_dir}/skill/${SKILL_NAME}/references/usage/patterns.md"
    curl -fsSL "${REPO_URL}/skill/${SKILL_NAME}/references/usage/gotchas.md" -o "${src_dir}/skill/${SKILL_NAME}/references/usage/gotchas.md"
    curl -fsSL "${REPO_URL}/command/${SKILL_NAME}.md" -o "${src_dir}/command/${SKILL_NAME}.md"
  fi

  install_to() {
    local platform_name=$1
    local base_dir=$2
    local command_dir=${3:-""}

    local target_skill_dir="${base_dir}/${SKILL_NAME}"

    if [[ -z "$target_skill_dir" ]] || [[ "$target_skill_dir" == "/" ]]; then
      echo "Safety Error: Target path is restricted: $target_skill_dir" >&2
      return 1
    fi

    if [[ -d "${base_dir%/*}" ]] || [[ "$install_type" == "local" ]]; then
      echo "Installing to ${platform_name}..."
      mkdir -p "$base_dir"

      if [[ -d "$target_skill_dir" ]]; then
        case "$target_skill_dir" in
          */"${SKILL_NAME}")
            rm -rf "$target_skill_dir"
            ;;
          *)
            echo "Safety Error: Target directory does not end in ${SKILL_NAME}." >&2
            exit 1
            ;;
        esac
      fi

      cp -r "${src_dir}/skill/${SKILL_NAME}" "$target_skill_dir"

      if [[ -f "${target_skill_dir}/Skill.md" ]]; then
        mv "${target_skill_dir}/Skill.md" "${target_skill_dir}/SKILL.md"
      fi

      if [[ -n "$command_dir" ]]; then
        mkdir -p "$command_dir"
        local cmd_path="${command_dir}/${SKILL_NAME}.md"
        rm -f "$cmd_path"
        cp "${src_dir}/command/${SKILL_NAME}.md" "$cmd_path"
        echo "  Command installed to: ${cmd_path}"
      fi

      echo "  Skill installed to: ${target_skill_dir}"
    fi
  }

  if [[ "$install_type" == "global" ]]; then
    install_to "OpenCode (Global)" "${HOME}/.config/opencode/skills" "${HOME}/.config/opencode/commands"
    install_to "Gemini CLI (Global)" "${HOME}/.gemini/skills"
    install_to "Claude (Global)" "${HOME}/.claude/skills"
    install_to "FactoryAI Droid (Global)" "${HOME}/.factory/skills"
  else
    install_to "OpenCode (Local)" ".opencode/skills" ".opencode/commands"
    install_to "Gemini CLI (Local)" ".gemini/skills"
    install_to "Claude (Local)" ".claude/skills"
    install_to "FactoryAI Droid (Local)" ".factory/skills"
  fi

  echo "Done."
}

main "$@"
