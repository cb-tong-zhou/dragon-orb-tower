import { getCharacter } from "../content/characters";
import type { FriendHelpMode, PartyMember } from "../game/friends";
import { CharacterAvatar } from "./CharacterAvatar";
import { IconStar } from "./Icons";

interface Props {
  /** Every rescued friend, in rescue order (the current friend once rescued). */
  roster: string[];
  /** Runtime state of the friends who are actively walking with Sora. */
  party: PartyMember[];
  /** The active party window (up to three ids). */
  activeIds: string[];
  selectedFriendId: string | null;
  helpMode: FriendHelpMode;
  onSelect: (characterId: string) => void;
}

/**
 * The friends rail: shows rescued friends, who is active, who still has a
 * scout charge, and who needs help. Tapping an active friend selects them for
 * a manual scout (or recalls them while they are out).
 */
export function PartyBar({
  roster,
  party,
  activeIds,
  selectedFriendId,
  helpMode,
  onSelect,
}: Props) {
  if (roster.length === 0) return null;

  const membersById = new Map(party.map((member) => [member.characterId, member]));
  const readyCount = party.filter(
    (member) => member.hasCharge && member.mode === "follow",
  ).length;
  const scouting = helpMode !== "off";

  return (
    <div className="party-bar" data-party-bar>
      <span className="party-bar-label">
        <IconStar size={14} />
        {readyCount > 0
          ? `${readyCount} helper${readyCount > 1 ? "s" : ""} ready`
          : "Friends"}
      </span>
      <div className="party-bar-row" role="group" aria-label="Rescued friends">
        {roster.map((characterId) => {
          const character = getCharacter(characterId);
          const member = membersById.get(characterId);
          const isActive = activeIds.includes(characterId);
          const mode = member?.mode ?? "follow";
          const blocked = mode === "blocked";
          const outScouting = mode === "scout" || mode === "return";
          const selected = selectedFriendId === characterId;
          const canSend =
            scouting && isActive && mode === "follow" && (member?.hasCharge ?? false);

          const label = blocked
            ? `${character.name} needs help`
            : outScouting
              ? `Recall ${character.name}`
              : canSend
                ? `Send ${character.name} to check a path`
                : isActive
                  ? `${character.name} is walking with you`
                  : `${character.name} is resting in the tower`;

          return (
            <button
              key={characterId}
              type="button"
              className={[
                "party-chip",
                isActive ? "is-active" : "",
                selected ? "is-selected" : "",
                blocked ? "is-blocked" : "",
                outScouting ? "is-scouting" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-party-member={characterId}
              data-party-charge={member?.hasCharge ? "true" : "false"}
              data-party-blocked={blocked ? "true" : "false"}
              data-party-active={isActive ? "true" : "false"}
              aria-label={label}
              title={label}
              onClick={() => onSelect(characterId)}
            >
              <CharacterAvatar character={character} size={38} aura={blocked} />
              <span className="party-chip-name">{character.name}</span>
              {isActive && scouting ? (
                <span
                  className={`party-charge ${member?.hasCharge ? "" : "is-used"}`}
                  aria-hidden="true"
                >
                  ★
                </span>
              ) : null}
              {blocked ? (
                <span className="party-blocked-badge" aria-hidden="true">
                  !
                </span>
              ) : null}
              {outScouting ? (
                <span className="party-scouting-badge" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
